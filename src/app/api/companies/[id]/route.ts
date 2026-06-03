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

  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error, supabase };
}

// GET /api/companies/[id] - Get company by ID or slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await getUser(request);
  const { id } = await params;

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (error || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  return NextResponse.json({ company });
}

// PATCH /api/companies/[id] - Update company
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await getUser(request);
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user belongs to this company
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.company_id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, logo_url, primary_color, phone, email, address } = body;

    const { data: company, error } = await supabase
      .from('companies')
      .update({ name, description, logo_url, primary_color, phone, email, address })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
