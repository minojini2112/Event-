import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured properly' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: events, error } = await supabase
      .from('all_events')
      .select('event_id, start_date, end_date, registered_no');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch events for stats', details: error.message },
        { status: 500 }
      );
    }

    const now = new Date();
    let totalParticipants = 0;
    let liveEvents = 0;
    let upcomingEvents = 0;
    let pastEvents = 0;

    (events || []).forEach((ev) => {
      const start = ev.start_date ? new Date(ev.start_date) : null;
      const end = ev.end_date ? new Date(ev.end_date) : null;
      const reg = Number(ev.registered_no) || 0;
      totalParticipants += reg;
      if (start && end) {
        if (start <= now && now <= end) {
          liveEvents += 1;
        } else if (start > now) {
          upcomingEvents += 1;
        } else if (end < now) {
          pastEvents += 1;
        }
      } else if (start && !end) {
        if (start > now) upcomingEvents += 1; else pastEvents += 1;
      } else if (!start && end) {
        if (end < now) pastEvents += 1;
      }
    });

    return NextResponse.json({
      totalEvents: (events || []).length,
      totalParticipants,
      liveEvents,
      upcomingEvents,
      pastEvents,
    });
  } catch (error) {
    console.error('Unexpected error computing stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


