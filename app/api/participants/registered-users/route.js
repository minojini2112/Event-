import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured properly' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch registration row for this event
    const { data: registration, error: regErr } = await supabase
      .from('registrations')
      .select('registration_id')
      .eq('event_id', event_id)
      .maybeSingle();
    if (regErr) {
      return NextResponse.json({ error: 'Failed to fetch registration' }, { status: 500 });
    }
    if (!registration) {
      return NextResponse.json({ users: [] });
    }

    // Join members -> profiles to get usernames
    const { data: members, error: memErr } = await supabase
      .from('registration_members')
      .select('participant_id, participants_profile(username)')
      .eq('registration_id', registration.registration_id);
    if (memErr) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    const users = (members || []).map(m => ({
      profile_id: m.participant_id,
      username: m.participants_profile?.username || `user_${m.participant_id}`
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}


