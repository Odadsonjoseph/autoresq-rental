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

// GET /api/verification - Get verification status for current user
export async function GET(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, phone, id_verification, license_verification, insurance_verification')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ verification: profile });
}

// POST /api/verification - Submit verification documents
export async function POST(request: NextRequest) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, document_url, id_number, license_number, insurance_policy } = body; // type: 'id' | 'license' | 'insurance'

    if (!type || !['id', 'license', 'insurance'].includes(type)) {
      return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    const verificationField = type === 'id' ? 'id_verification' : type === 'license' ? 'license_verification' : 'insurance_verification';

    updates[verificationField] = 'pending';

    // In production, you'd store document_url references in a verification_documents table
    // For now, we'll just update the status and store metadata
    const { data: profile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // In a real system, you'd trigger verification webhook to 3rd-party service here
    // For demo, we'll auto-approve after 2 seconds (simulated)
    setTimeout(async () => {
      await supabase
        .from('users')
        .update({ [verificationField]: 'passed' })
        .eq('id', user.id);
    }, 2000);

    return NextResponse.json({ verification: profile, message: 'Verification submitted' });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// PATCH /api/verification - Admin update verification status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin role
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { id_verification, license_verification, insurance_verification } = body;

  const updates: Record<string, string> = {};
  if (id_verification) updates.id_verification = id_verification;
  if (license_verification) updates.license_verification = license_verification;
  if (insurance_verification) updates.insurance_verification = insurance_verification;

  const { data: updated, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ verification: updated });
}
