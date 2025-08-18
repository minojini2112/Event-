import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { event_id, user_id } = body;

    // Validate required fields
    if (!event_id || !user_id) {
      console.log('Missing fields - event_id:', event_id, 'user_id:', user_id);
      return NextResponse.json(
        { error: 'Event ID and User ID are required' },
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

    // Check if already wishlisted
    const { data: existingCheck, error: checkError } = await supabase
      .from('wishlisted_events')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing wishlist:', checkError);
      return NextResponse.json(
        { error: 'Failed to check wishlist status' },
        { status: 500 }
      );
    }

    if (existingCheck) {
      return NextResponse.json(
        { error: 'Event is already in wishlist' },
        { status: 409 }
      );
    }

    // Add to wishlist
    const { data: result, error: insertError } = await supabase
      .from('wishlisted_events')
      .insert({
        event_id: event_id,
        user_id: user_id
      })
      .select('id, event_id, user_id, wishlisted_at')
      .single();

    if (insertError) {
      console.error('Error inserting into wishlist:', insertError);
      return NextResponse.json(
        { error: 'Failed to add event to wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event added to wishlist successfully',
      data: result
    });

  } catch (error) {
    console.error('Error adding event to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add event to wishlist' },
      { status: 500 }
    );
  }
}
