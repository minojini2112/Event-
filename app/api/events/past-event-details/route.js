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

    // Fetch past event details
    const { data: pastEventData, error: pastEventError } = await supabase
      .from('past_events')
      .select(`
        event_id,
        photos,
        winners,
        event_details,
        students_feedback
      `)
      .eq('event_id', event_id)
      .single();

    if (pastEventError) {
      if (pastEventError.code === 'PGRST116') {
        // Event not found in past_events table
        return NextResponse.json({
          success: true,
          isPastEvent: false,
          message: 'Event not found in past events'
        });
      }
      console.error('Error fetching past event data:', pastEventError);
      return NextResponse.json(
        { error: 'Failed to fetch past event details' },
        { status: 500 }
      );
    }

    // Parse JSONB fields if they're strings
    let photos = [];
    let winners = [];
    let studentsFeedback = [];

    try {
      if (pastEventData.photos) {
        photos = typeof pastEventData.photos === 'string' 
          ? JSON.parse(pastEventData.photos) 
          : pastEventData.photos;
      }
    } catch (e) {
      console.warn('Failed to parse photos JSON:', e);
    }

    try {
      if (pastEventData.winners) {
        winners = typeof pastEventData.winners === 'string' 
          ? JSON.parse(pastEventData.winners) 
          : pastEventData.winners;
      }
    } catch (e) {
      console.warn('Failed to parse winners JSON:', e);
    }

    try {
      if (pastEventData.students_feedback) {
        studentsFeedback = typeof pastEventData.students_feedback === 'string' 
          ? JSON.parse(pastEventData.students_feedback) 
          : pastEventData.students_feedback;
      }
    } catch (e) {
      console.warn('Failed to parse students_feedback JSON:', e);
    }

    return NextResponse.json({
      success: true,
      isPastEvent: true,
      pastEvent: {
        event_id: pastEventData.event_id,
        photos: photos,
        winners: winners,
        event_details: pastEventData.event_details,
        students_feedback: studentsFeedback
      }
    });

  } catch (error) {
    console.error('Error fetching past event details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past event details' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { event_id, photos, winners, event_details } = body || {};

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured properly' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalized = {
      ...(photos !== undefined ? { photos: Array.isArray(photos) ? photos : [] } : {}),
      ...(winners !== undefined ? { winners: Array.isArray(winners) ? winners : [] } : {}),
      ...(event_details !== undefined ? { event_details } : {}),
    };

    // Ensure there is a row for this past event
    const { data: existing, error: fetchErr } = await supabase
      .from('past_events')
      .select('event_id')
      .eq('event_id', event_id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: 'Failed to verify past event' }, { status: 500 });
    }

    let upsertError;
    if (existing) {
      const { error } = await supabase
        .from('past_events')
        .update(normalized)
        .eq('event_id', event_id);
      upsertError = error;
    } else {
      const { error } = await supabase
        .from('past_events')
        .insert([{ event_id, ...normalized }]);
      upsertError = error;
    }

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to save past event details' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Past event details saved' });
  } catch (error) {
    console.error('Error saving past event details:', error);
    return NextResponse.json({ error: 'Failed to save past event details' }, { status: 500 });
  }
}