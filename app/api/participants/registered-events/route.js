import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Database not configured properly' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the profile_id from participants_profile table using the user_id
    const { data: userProfile, error: profileError } = await supabase
      .from('participants_profile')
      .select('profile_id')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const profileId = userProfile.profile_id;

    // Get all events that the user has registered for through registration_members
    const { data: registrations, error: regError } = await supabase
      .from('registration_members')
      .select(`
        registration_id,
        registrations!inner (
          event_id,
          all_events (
            event_id,
            event_name,
            start_date,
            end_date,
            description,
            caption,
            image_url,
            total_participants_allowed,
            registered_no
          )
        )
      `)
      .eq('participant_id', profileId);

    if (regError) {
      console.error('Error fetching registrations:', regError);
      return NextResponse.json(
        { error: 'Failed to fetch registered events' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const events = registrations
      .filter(reg => reg.registrations && reg.registrations.all_events) // Filter out any null events
      .map(reg => ({
        id: reg.registrations.event_id,
        title: reg.registrations.all_events.event_name,
        start_date: reg.registrations.all_events.start_date,
        end_date: reg.registrations.all_events.end_date,
        description: reg.registrations.all_events.description,
        caption: reg.registrations.all_events.caption,
        image_url: reg.registrations.all_events.image_url,
        total_participants_allowed: reg.registrations.all_events.total_participants_allowed,
        registered_no: reg.registrations.all_events.registered_no
      }));

    return NextResponse.json({
      success: true,
      events: events,
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching registered events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registered events' },
      { status: 500 }
    );
  }
}
