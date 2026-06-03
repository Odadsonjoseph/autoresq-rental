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

// GET /api/claims - List claims
export async function GET(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const { data: userProfile } = await supabase.from('users').select('company_id').eq('id', user.id).single();

  let query = supabase
    .from('claims')
    .select(`*, rental:rentals(*), company:companies(id, name)`)
    .order('created_at', { ascending: false });

  if (userProfile?.company_id) {
    query = query.eq('company_id', userProfile.company_id);
  }

  if (status) query = query.eq('status', status);

  const { data: claims, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ claims });
}

// POST /api/claims - Create claim
export async function POST(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { rental_id, description } = body;

    // Get rental to find company
    const { data: rental } = await supabase.from('rentals').select('company_id').eq('id', rental_id).single();

    const { data: claim, error } = await supabase
      .from('claims')
      .insert({ rental_id, company_id: rental?.company_id, description, status: 'filed' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ claim }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
