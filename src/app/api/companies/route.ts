import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Get user session helper
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

  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error, supabase };
}

// GET /api/companies - List all companies
export async function GET(request: NextRequest) {
  const { user, supabase } = await getUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const verified = searchParams.get('verified');
  const isBroker = searchParams.get('is_broker');

  let query = supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (verified !== null) {
    query = query.eq('verified', verified === 'true');
  }
  if (isBroker !== null) {
    query = query.eq('is_broker', isBroker === 'true');
  }

  const { data: companies, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ companies });
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  const { user, supabase } = await getUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, logo_url, primary_color, phone, email, address, is_broker } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug is already taken
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }

    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        slug,
        description,
        logo_url,
        primary_color: primary_color || '#c9a227',
        phone,
        email,
        address,
        is_broker: is_broker || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update user's company_id and role
    await supabase
      .from('users')
      .update({ company_id: company.id, role: is_broker ? 'broker' : 'company' })
      .eq('id', user.id);

    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
