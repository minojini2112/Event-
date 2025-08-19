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

export async function POST(request) {
  try {
    console.log('API: Starting to create event...');
    
    // Parse the request body
    const eventData = await request.json();
    console.log('API: Received event data:', eventData);
    
    // Validate required fields (DB requires end_date NOT NULL)
    if (!eventData.event_name || !eventData.start_date || !eventData.end_date || !eventData.description) {
      return NextResponse.json(
        { error: 'Missing required fields: event_name, start_date, end_date, and description are required' },
        { status: 400 }
      );
    }
    
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
    
    // Prepare the event data for database insertion
    const toNumberOrNull = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    const eventToInsert = {
      event_name: eventData.event_name,
      description: eventData.description,
      caption: eventData.caption || null,
      start_date: eventData.start_date,
      end_date: eventData.end_date, // NOT NULL in DB
      image_url: Array.isArray(eventData.image_urls) && eventData.image_urls.length > 0 ? eventData.image_urls[0] : null,
      registered_no: toNumberOrNull(eventData.registered_count),
      total_participants_allowed: toNumberOrNull(eventData.total_participants_allowed),
      registration_link: eventData.registration_link || null,
      registration_type: eventData.registration_type || 'individual',
      student_coordinators: Array.isArray(eventData.student_coordinators) ? eventData.student_coordinators : [],
      staff_incharge: Array.isArray(eventData.staff_incharge) ? eventData.staff_incharge : []
    };
    
    console.log('API: Inserting event data:', eventToInsert);
    
    // Insert the event into the all_events table
    const { data, error } = await supabase
      .from('all_events')
      .insert([eventToInsert])
      .select();
    
    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to create event in database', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('API: Event created successfully:', data);
    
    return NextResponse.json({ 
      success: true,
      event: data[0],
      message: 'Event created successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
