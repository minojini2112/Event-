import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { event_id, participant_id, feedback_text } = await request.json();

    if (!event_id || !participant_id || !feedback_text) {
      return NextResponse.json(
        { error: 'Event ID, participant ID, and feedback text are required' },
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

    // First, verify that the participant is registered for this event
    const { data: registration, error: regError } = await supabase
      .from('registration_members')
      .select(`
        registration_id,
        registrations!inner (
          event_id
        )
      `)
      .eq('participant_id', participant_id)
      .eq('registrations.event_id', event_id)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Participant is not registered for this event' },
        { status: 403 }
      );
    }

    // Get current feedback from past_events table
    const { data: pastEventData, error: fetchError } = await supabase
      .from('past_events')
      .select('students_feedback')
      .eq('event_id', event_id)
      .single();

    if (fetchError) {
      // If no past event record exists, create one
      if (fetchError.code === 'PGRST116') {
        const { data: newPastEvent, error: createError } = await supabase
          .from('past_events')
          .insert({
            event_id: event_id,
            students_feedback: [{
              participant_id: participant_id,
              feedback: feedback_text,
              timestamp: new Date().toISOString()
            }]
          })
          .select('students_feedback')
          .single();

        if (createError) {
          console.error('Error creating past event record:', createError);
          return NextResponse.json(
            { error: 'Failed to create past event record' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Feedback added successfully',
          feedback: newPastEvent.students_feedback
        });
      }

      console.error('Error fetching past event data:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch past event details' },
        { status: 500 }
      );
    }

    // Parse existing feedback
    let currentFeedback = [];
    try {
      if (pastEventData.students_feedback) {
        currentFeedback = typeof pastEventData.students_feedback === 'string' 
          ? JSON.parse(pastEventData.students_feedback) 
          : pastEventData.students_feedback;
      }
    } catch (e) {
      console.warn('Failed to parse existing feedback JSON:', e);
      currentFeedback = [];
    }

    // Check if participant has already submitted feedback
    const existingFeedbackIndex = currentFeedback.findIndex(
      fb => fb.participant_id === participant_id
    );

    if (existingFeedbackIndex !== -1) {
      // Update existing feedback
      currentFeedback[existingFeedbackIndex] = {
        participant_id: participant_id,
        feedback: feedback_text,
        timestamp: new Date().toISOString()
      };
    } else {
      // Add new feedback
      currentFeedback.push({
        participant_id: participant_id,
        feedback: feedback_text,
        timestamp: new Date().toISOString()
      });
    }

    // Update the past_events table with new feedback
    const { data: updatedData, error: updateError } = await supabase
      .from('past_events')
      .update({ students_feedback: currentFeedback })
      .eq('event_id', event_id)
      .select('students_feedback')
      .single();

    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: existingFeedbackIndex !== -1 ? 'Feedback updated successfully' : 'Feedback added successfully',
      feedback: updatedData.students_feedback
    });

  } catch (error) {
    console.error('Error adding feedback:', error);
    return NextResponse.json(
      { error: 'Failed to add feedback' },
      { status: 500 }
    );
  }
}
