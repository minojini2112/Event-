import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { event_id, user_id } = await request.json();

    // Validate required fields
    if (!event_id || !user_id) {
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

    // Check if event is in wishlist
    const { data: result, error: checkError } = await supabase
      .from('wishlisted_events')
      .select('id, wishlisted_at')
      .eq('event_id', event_id)
      .eq('user_id', user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking wishlist status:', checkError);
      return NextResponse.json(
        { error: 'Failed to check wishlist status' },
        { status: 500 }
      );
    }

    const isWishlisted = !!result;

    return NextResponse.json({
      success: true,
      isWishlisted,
      data: isWishlisted ? result : null
    });

  } catch (error) {
    console.error('Error checking wishlist status:', error);
    return NextResponse.json(
      { error: 'Failed to check wishlist status' },
      { status: 500 }
    );
  }
}
