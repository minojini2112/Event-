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

    // For now, we'll return an empty array since there's no winners table yet
    // This can be updated when the winners tracking system is implemented
    // You might want to create a table like 'event_winners' with columns:
    // - id, event_id, participant_id, position, won_at, etc.
    
    // Since the winners table doesn't exist yet, return empty array
    console.log('Winners table not implemented yet, returning empty array');
    return NextResponse.json({
      success: true,
      events: [],
      count: 0
    });



  } catch (error) {
    console.error('Error fetching won events:', error);
    // Return empty array for now since winners system isn't implemented
    return NextResponse.json({
      success: true,
      events: [],
      count: 0
    });
  }
}
