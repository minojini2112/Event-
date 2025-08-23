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

// POST: Create a new access request from an event admin
export async function POST(request) {
  try {
    const { eventName, adminUserId } = await request.json();

    if (!eventName || !adminUserId) {
      return NextResponse.json(
        { error: 'eventName and adminUserId are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Prevent duplicate pending requests for the same admin (regardless of event name)
    const { data: existing, error: existingError } = await supabase
      .from('event_admin_access')
      .select('id, status')
      .eq('admin_id', adminUserId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing request:', existingError);
    } else if (existing && existing.status === 'pending') {
      return NextResponse.json(
        { error: 'A pending request already exists for your account.' },
        { status: 409 }
      );
    }

    const { data: insertData, error: insertError } = await supabase
      .from('event_admin_access')
      .insert({
        admin_id: adminUserId,
        event_name: eventName,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting access request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create access request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, request: insertData });
  } catch (err) {
    console.error('Error in access-requests POST:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: List access requests for global admins (optional ?status=pending|approved|rejected)
export async function GET(request) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('event_admin_access')
      .select('id, admin_id, status, requested_at, decided_at, event_name, users(username)')
      .order('requested_at', { ascending: false });

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching access requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    const requests = (data || []).map((r) => ({
      id: r.id,
      admin_id: r.admin_id,
      admin_username: r.users?.username ?? null,
      admin_email: null,
      status: r.status,
      requested_at: r.requested_at,
      reviewed_at: r.decided_at,
      reviewed_by_username: null,
      event_name: r.event_name
    }));

    return NextResponse.json({ requests });
  } catch (err) {
    console.error('Error in access-requests GET:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


