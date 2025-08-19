import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
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

    // Get event registration information
    const { data: eventData, error: eventError } = await supabase
      .from('all_events')
      .select(`
        event_id,
        event_name,
        registration_type,
        total_participants_allowed,
        registered_no
      `)
      .eq('event_id', event_id)
      .single();

    if (eventError) {
      console.error('Error fetching event data:', eventError);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Calculate available spots
    const availableSpots = eventData.total_participants_allowed 
      ? eventData.total_participants_allowed - (eventData.registered_no || 0)
      : null;

    return NextResponse.json({
      success: true,
      event: {
        id: eventData.event_id,
        name: eventData.event_name,
        registration_type: eventData.registration_type,
        total_participants_allowed: eventData.total_participants_allowed,
        registered_no: eventData.registered_no,
        available_spots: availableSpots,
        is_full: availableSpots !== null && availableSpots <= 0
      }
    });

  } catch (error) {
    console.error('Error fetching event registration info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event registration info' },
      { status: 500 }
    );
  }
}
