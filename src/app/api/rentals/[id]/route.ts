import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

async function getUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epjfkpzjekhzlqazfasu.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

// GET /api/rentals/[id] - Get rental by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data: rental, error } = await supabase
    .from('rentals')
    .select(`*, listing:vehicle_listings(*), customer:users(id, first_name, last_name, email)`)
    .eq('id', id)
    .single();

  if (error || !rental) return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
  return NextResponse.json({ rental });
}

// PATCH /api/rentals/[id] - Update rental status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Get user's company
  const { data: userProfile } = await supabase.from('users').select('company_id').eq('id', user.id).single();

  // Get rental
  const { data: rental } = await supabase.from('rentals').select('company_id, listing_id').eq('id', id).single();
  if (!rental) return NextResponse.json({ error: 'Rental not found' }, { status: 404 });

  // Check ownership
  if (userProfile?.company_id !== rental.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error } = await supabase.from('rentals').update({ status }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update vehicle status based on rental status
  if (status === 'cancelled' || status === 'completed') {
    await supabase.from('vehicle_listings').update({ status: 'active' }).eq('id', rental.listing_id);
  } else if (status === 'active') {
    await supabase.from('vehicle_listings').update({ status: 'reserved' }).eq('id', rental.listing_id);
  }

  return NextResponse.json({ rental: updated });
}
