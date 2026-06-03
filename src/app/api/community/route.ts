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

// GET /api/community - List community posts
export async function GET(request: NextRequest) {
  const { supabase } = await getUser(request);
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const { data: posts, error } = await supabase
    .from('community_posts')
    .select(`*, company:companies(id, name, slug, logo_url)`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts });
}

// POST /api/community - Create community post
export async function POST(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userProfile } = await supabase.from('users').select('company_id').eq('id', user.id).single();
  if (!userProfile?.company_id) return NextResponse.json({ error: 'No company associated' }, { status: 400 });

  try {
    const body = await request.json();
    const { content, images } = body;
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({ company_id: userProfile.company_id, content, images: images || [] })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
