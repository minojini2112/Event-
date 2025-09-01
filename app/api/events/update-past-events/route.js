import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
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

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log('Checking for past events as of:', currentDate);

    // Find all events where end_date is in the past
    const { data: pastEvents, error: fetchError } = await supabase
      .from('all_events')
      .select('event_id, event_name, end_date')
      .lt('end_date', currentDate);

    if (fetchError) {
      console.error('Error fetching past events:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch past events' },
        { status: 500 }
      );
    }

    if (!pastEvents || pastEvents.length === 0) {
      console.log('No past events found');
      return NextResponse.json({
        success: true,
        message: 'No past events found',
        events_processed: 0,
        events_added: 0
      });
    }

    console.log(`Found ${pastEvents.length} past events`);

    // Check which events are already in past_events table
    const eventIds = pastEvents.map(event => event.event_id);
    
    const { data: existingPastEvents, error: checkError } = await supabase
      .from('past_events')
      .select('event_id')
      .in('event_id', eventIds);

    if (checkError) {
      console.error('Error checking existing past events:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing past events' },
        { status: 500 }
      );
    }

    const existingEventIds = existingPastEvents?.map(event => event.event_id) || [];
    const newPastEvents = pastEvents.filter(event => !existingEventIds.includes(event.event_id));

    if (newPastEvents.length === 0) {
      console.log('All past events are already in past_events table');
      return NextResponse.json({
        success: true,
        message: 'All past events are already in past_events table',
        events_processed: pastEvents.length,
        events_added: 0
      });
    }

    console.log(`Adding ${newPastEvents.length} new events to past_events table`);

    // Insert new past events
    const { data: insertedEvents, error: insertError } = await supabase
      .from('past_events')
      .insert(
        newPastEvents.map(event => ({
          event_id: event.event_id
        }))
      )
      .select('past_event_id, event_id');

    if (insertError) {
      console.error('Error inserting past events:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert past events' },
        { status: 500 }
      );
    }

    console.log(`Successfully added ${insertedEvents.length} events to past_events table`);

    return NextResponse.json({
      success: true,
      message: 'Past events updated successfully',
      events_processed: pastEvents.length,
      events_added: insertedEvents.length,
      events_added_details: insertedEvents.map(event => ({
        past_event_id: event.past_event_id,
        event_id: event.event_id
      }))
    });

  } catch (error) {
    console.error('Error updating past events:', error);
    return NextResponse.json(
      { error: 'Failed to update past events' },
      { status: 500 }
    );
  }
}

// Also provide a GET method to check current status
export async function GET() {
  try {
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

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Count past events in all_events table
    const { data: pastEvents, error: pastError } = await supabase
      .from('all_events')
      .select('event_id, event_name, end_date')
      .lt('end_date', currentDate);

    if (pastError) {
      console.error('Error fetching past events:', pastError);
      return NextResponse.json(
        { error: 'Failed to fetch past events' },
        { status: 500 }
      );
    }

    // Count events in past_events table
    const { count: pastEventsCount, error: countError } = await supabase
      .from('past_events')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting past events:', countError);
      return NextResponse.json(
        { error: 'Failed to count past events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      current_date: currentDate,
      past_events_in_all_events: pastEvents?.length || 0,
      events_in_past_events_table: pastEventsCount || 0,
      events_needing_migration: Math.max(0, (pastEvents?.length || 0) - (pastEventsCount || 0))
    });

  } catch (error) {
    console.error('Error checking past events status:', error);
    return NextResponse.json(
      { error: 'Failed to check past events status' },
      { status: 500 }
    );
  }
}
