import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

async function getUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epjfkpzjekhzlqazfasu.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

// GET /api/rentals - List rentals
export async function GET(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status');

  // Get user's company
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  let query = supabase
    .from('rentals')
    .select(`
      *,
      listing:vehicle_listings(id, make, model, year, images),
      customer:users(id, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by company for companies/brokers, by user for customers
  if (userProfile?.role === 'customer') {
    query = query.eq('customer_id', user.id);
  } else if (userProfile?.company_id) {
    query = query.eq('company_id', userProfile.company_id);
  }

  if (status) query = query.eq('status', status);

  const { data: rentals, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rentals });
}

// POST /api/rentals - Create rental booking
export async function POST(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  try {
    const body = await request.json();
    const { listing_id, start_date, end_date, total_amount } = body;

    if (!listing_id || !start_date || !end_date || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get vehicle to find company
    const { data: vehicle } = await supabase
      .from('vehicle_listings')
      .select('company_id, status')
      .eq('id', listing_id)
      .single();

    if (!vehicle || vehicle.status !== 'active') {
      return NextResponse.json({ error: 'Vehicle not available' }, { status: 400 });
    }

    // Create rental
    const { data: rental, error } = await supabase
      .from('rentals')
      .insert({
        listing_id,
        customer_id: user.id,
        company_id: vehicle.company_id,
        start_date,
        end_date,
        total_amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark vehicle as reserved
    await supabase
      .from('vehicle_listings')
      .update({ status: 'reserved' })
      .eq('id', listing_id);

    return NextResponse.json({ rental }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
