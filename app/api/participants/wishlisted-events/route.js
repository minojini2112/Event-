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

    // Get all events that the user has wishlisted directly using user_id
    const { data: wishlistedEvents, error: wishlistError } = await supabase
      .from('wishlisted_events')
      .select(`
        event_id,
        wishlisted_at,
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
      `)
      .eq('user_id', user_id);

    if (wishlistError) {
      console.error('Error fetching wishlisted events:', wishlistError);
      return NextResponse.json(
        { error: 'Failed to fetch wishlisted events' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const events = wishlistedEvents
      .filter(wish => wish.all_events) // Filter out any null events
      .map(wish => ({
        id: wish.event_id,
        title: wish.all_events.event_name,
        start_date: wish.all_events.start_date,
        end_date: wish.all_events.end_date,
        description: wish.all_events.description,
        caption: wish.all_events.caption,
        image_url: wish.all_events.image_url,
        total_participants_allowed: wish.all_events.total_participants_allowed,
        registered_no: wish.all_events.registered_no,
        wishlisted_at: wish.wishlisted_at
      }));

    return NextResponse.json({
      success: true,
      events: events,
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching wishlisted events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlisted events' },
      { status: 500 }
    );
  }
}
