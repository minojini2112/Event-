import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request) {
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

    // Remove from wishlist
    const { data: result, error: deleteError } = await supabase
      .from('wishlisted_events')
      .delete()
      .eq('event_id', event_id)
      .eq('user_id', user_id)
      .select('id')
      .single();

    if (deleteError) {
      console.error('Error deleting from wishlist:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove event from wishlist' },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Event not found in wishlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event removed from wishlist successfully'
    });

  } catch (error) {
    console.error('Error removing event from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove event from wishlist' },
      { status: 500 }
    );
  }
}
