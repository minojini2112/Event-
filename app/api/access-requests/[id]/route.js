import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase service credentials');
  }
  return createClient(url, key);
}

// PATCH: Approve or reject a specific request
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from('event_admin_access')
      .update({ status, decided_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }

    // If approved, create a skeleton event record (only name)
    if (status === 'approved' && updated?.event_name) {
      const { error: insertError } = await supabase
        .from('all_events')
        .insert({ event_name: updated.event_name })
        .select()
        .single();
      if (insertError) {
        console.error('Skeleton event insert failed (non-fatal):', insertError);
      }
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (err) {
    console.error('PATCH /access-requests/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Fetch a single request by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('event_admin_access')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch single request error:', error);
      return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (err) {
    console.error('GET /access-requests/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


