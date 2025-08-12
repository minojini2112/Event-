import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('API: Starting to fetch events...');
    
    // Create a client with service role key to bypass RLS
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
    console.log('API: Supabase client initialized with service role');
    
    // Test the connection
    const { data: testData, error: testError } = await supabase
      .from('all_events')
      .select('count')
      .limit(1);
    
    console.log('API: Test query result:', { testData, testError });
    
    // Now try the actual query
    const { data, error } = await supabase
      .from('all_events')
      .select('*')
      .order('start_date', { ascending: true });

    console.log('API: Main query result:', { 
      dataLength: data?.length || 0, 
      error: error?.message || null,
      firstRecord: data?.[0] || null
    });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events from database', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      events: data || [],
      debug: {
        dataLength: data?.length || 0,
        hasData: !!data && data.length > 0,
        tableName: 'all_events'
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
