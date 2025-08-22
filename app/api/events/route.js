import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    console.log('API: Starting to fetch events...');
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    
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
    
    let data;
    let error;

    if (adminId) {
      // Fetch events associated with this admin via approved access requests
      const { data: approvals, error: approvalsError } = await supabase
        .from('event_admin_access')
        .select('event_name')
        .eq('admin_id', adminId)
        .eq('status', 'approved');

      if (approvalsError) {
        console.error('API: Error fetching approvals for admin:', approvalsError);
        return NextResponse.json(
          { error: 'Failed to fetch admin events', details: approvalsError.message },
          { status: 500 }
        );
      }

      const names = (approvals || []).map((a) => a.event_name).filter(Boolean);
      if (names.length === 0) {
        data = [];
      } else {
        const res = await supabase
          .from('all_events')
          .select('*')
          .in('event_name', names)
          .order('event_id', { ascending: false });
        data = res.data;
        error = res.error;
      }
    } else {
      // Fetch all events (default)
      const res = await supabase
        .from('all_events')
        .select('*')
        .order('start_date', { ascending: true });
      data = res.data;
      error = res.error;
    }

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
    
    console.log('API: Preparing to upsert event data:', eventToInsert);

    // Try to find a skeleton row created during approval
    let updatedOrInserted;
    let dbError;

    const { data: skeleton, error: findError } = await supabase
      .from('all_events')
      .select('event_id, description, start_date, end_date')
      .eq('event_name', eventToInsert.event_name)
      .is('description', null)
      .is('start_date', null)
      .is('end_date', null)
      .order('event_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.warn('API: Could not check for skeleton row (continuing with insert):', findError);
    }

    if (skeleton && skeleton.event_id) {
      // Update the existing skeleton row with full details
      const { data: updated, error: updateError } = await supabase
        .from('all_events')
        .update(eventToInsert)
        .eq('event_id', skeleton.event_id)
        .select();
      updatedOrInserted = updated;
      dbError = updateError;
      console.log('API: Updated existing skeleton row', { event_id: skeleton.event_id, ok: !updateError });
    } else {
      // No skeleton; insert a new event row
      const { data: inserted, error: insertError } = await supabase
        .from('all_events')
        .insert([eventToInsert])
        .select();
      updatedOrInserted = inserted;
      dbError = insertError;
      console.log('API: Inserted new event row', { ok: !insertError });
    }
    
    if (dbError) {
      console.error('Error saving event:', dbError);
      return NextResponse.json(
        { error: 'Failed to save event in database', details: dbError.message },
        { status: 500 }
      );
    }
    
    console.log('API: Event saved successfully:', updatedOrInserted);
    
    return NextResponse.json({ 
      success: true,
      event: updatedOrInserted[0],
      message: 'Event saved successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
