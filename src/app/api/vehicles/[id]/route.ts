import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

async function getUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epjfkpzjekhzlqazfasu.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

// GET /api/vehicles/[id] - Get vehicle by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await getUser(request);
  const { id } = await params;

  const { data: vehicle, error } = await supabase
    .from('vehicle_listings')
    .select(`
      *,
      company:companies(id, name, slug, logo_url, verified, primary_color, phone, email)
    `)
    .eq('id', id)
    .single();

  if (error || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  }

  return NextResponse.json({ vehicle });
}

// PATCH /api/vehicles/[id] - Update vehicle
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await getUser(request);
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  // Verify ownership
  const { data: vehicle } = await supabase
    .from('vehicle_listings')
    .select('company_id')
    .eq('id', id)
    .single();

  if (!vehicle || (userProfile?.company_id !== vehicle.company_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { make, model, year, color, images, retail_price, broker_price, status: vehicleStatus } = body;

    const { data: updatedVehicle, error } = await supabase
      .from('vehicle_listings')
      .update({ make, model, year, color, images, retail_price, broker_price, status: vehicleStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicle: updatedVehicle });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/vehicles/[id] - Delete vehicle
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await getUser(request);
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  // Verify ownership
  const { data: vehicle } = await supabase
    .from('vehicle_listings')
    .select('company_id')
    .eq('id', id)
    .single();

  if (!vehicle || (userProfile?.company_id !== vehicle.company_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('vehicle_listings')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
