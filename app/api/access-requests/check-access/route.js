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

// GET: Check if an admin has access to create events
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId');

    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Missing adminUserId' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Fetch the latest approved request for this admin
    const { data: approvedList, error: approvedErr } = await supabase
      .from('event_admin_access')
      .select('id, event_name, decided_at')
      .eq('admin_id', adminUserId)
      .eq('status', 'approved')
      .order('decided_at', { ascending: false })
      .limit(1);

    if (approvedErr) {
      console.error('Error checking approved requests:', approvedErr);
      return NextResponse.json({ error: 'Failed to check access request' }, { status: 500 });
    }

    const approvedRequest = approvedList?.[0];
    if (!approvedRequest) {
      return NextResponse.json({ hasAccess: false });
    }

    // Verify there is a skeleton event (only name present) for this approved event
    const { data: existingEvent, error: evErr } = await supabase
      .from('all_events')
      .select('*')
      .eq('event_name', approvedRequest.event_name)
      .order('event_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (evErr) {
      console.error('Error loading event skeleton:', evErr);
      return NextResponse.json({ error: 'Failed to verify event access' }, { status: 500 });
    }

    // Consider it a skeleton if critical fields are still empty
    const isSkeleton = !existingEvent || (
      (!existingEvent.description || existingEvent.description === '') &&
      !existingEvent.start_date &&
      !existingEvent.end_date
    );

    return NextResponse.json({ hasAccess: isSkeleton, approvedEventName: approvedRequest.event_name });
  } catch (err) {
    console.error('Error in check-access API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


