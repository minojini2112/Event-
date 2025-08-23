import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('API: Fetching event with ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
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
    
    // Fetch the specific event by ID
    const { data, error } = await supabase
      .from('all_events')
      .select('*')
      .eq('event_id', id)
      .single();

    console.log('API: Event query result:', { 
      data: data ? 'Found' : 'Not found', 
      error: error?.message || null,
      eventId: id
    });

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching event:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event from database', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      event: data,
      debug: {
        eventId: id,
        hasData: !!data,
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

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured properly' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await request.json();

    const toNumberOrNull = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    const imageUrl = Array.isArray(payload.image_urls) && payload.image_urls.length > 0
      ? payload.image_urls[0]
      : (payload.image_url || null);

    const updateData = {
      // Allow updating core fields if provided
      ...(payload.event_name !== undefined ? { event_name: payload.event_name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.caption !== undefined ? { caption: payload.caption } : {}),
      ...(payload.start_date !== undefined ? { start_date: payload.start_date } : {}),
      ...(payload.end_date !== undefined ? { end_date: payload.end_date } : {}),
      ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
      ...(payload.registration_link !== undefined ? { registration_link: payload.registration_link } : {}),
      ...(payload.registration_type !== undefined ? { registration_type: payload.registration_type } : {}),
      ...(payload.student_coordinators !== undefined ? { student_coordinators: payload.student_coordinators } : {}),
      ...(payload.staff_incharge !== undefined ? { staff_incharge: payload.staff_incharge } : {}),
      ...(payload.total_participants_allowed !== undefined ? { total_participants_allowed: toNumberOrNull(payload.total_participants_allowed) } : {}),
      ...(payload.registered_count !== undefined ? { registered_no: toNumberOrNull(payload.registered_count) } : {}),
    };

    // No-op if nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' });
    }

    const { data, error } = await supabase
      .from('all_events')
      .update(updateData)
      .eq('event_id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update event', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event: data, message: 'Event updated successfully' });
  } catch (error) {
    console.error('Unexpected error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}