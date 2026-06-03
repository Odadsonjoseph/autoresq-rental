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

// GET /api/vehicles - List vehicle listings
export async function GET(request: NextRequest) {
  const { supabase } = await getUser(request);
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const companyId = searchParams.get('company_id');
  const status = searchParams.get('status');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');

  let query = supabase
    .from('vehicle_listings')
    .select(`
      *,
      company:companies(id, name, slug, logo_url, verified)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (companyId) query = query.eq('company_id', companyId);
  if (status) query = query.eq('status', status);
  if (minPrice) query = query.gte('retail_price', parseFloat(minPrice));
  if (maxPrice) query = query.lte('retail_price', parseFloat(maxPrice));

  const { data: vehicles, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vehicles });
}

// POST /api/vehicles - Create vehicle listing
export async function POST(request: NextRequest) {
  const { user, supabase } = await getUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!userProfile?.company_id) {
    return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { make, model, year, color, images, retail_price, broker_price, status: vehicleStatus } = body;

    if (!make || !model || !year || !retail_price) {
      return NextResponse.json({ error: 'Make, model, year, and price are required' }, { status: 400 });
    }

    const { data: vehicle, error } = await supabase
      .from('vehicle_listings')
      .insert({
        company_id: userProfile.company_id,
        make,
        model,
        year,
        color,
        images: images || [],
        retail_price,
        broker_price,
        status: vehicleStatus || 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
