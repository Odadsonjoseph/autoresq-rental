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

// POST /api/auth/signup - Extended signup with company creation
export async function POST(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated after signup' }, { status: 401 });

  try {
    const body = await request.json();
    const { company_name, company_slug, is_broker } = body;

    let company = null;
    let userUpdated = false;

    // If company info provided, create company and link to user
    if (company_name && company_slug) {
      // Check if slug is taken
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', company_slug)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Company slug already taken' }, { status: 409 });
      }

      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ name: company_name, slug: company_slug, is_broker: is_broker || false })
        .select()
        .single();

      if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 });
      company = newCompany;

      // Update user with company_id and role
      const { error: userError } = await supabase
        .from('users')
        .update({ company_id: company.id, role: is_broker ? 'broker' : 'company' })
        .eq('id', user.id);

      if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
      userUpdated = true;
    }

    return NextResponse.json({
      success: true,
      company,
      message: company ? 'Company created and linked' : 'User created'
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
