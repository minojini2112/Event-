import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    const { event_id, participant_id, team_name } = requestBody;
    let { registration_type } = requestBody;

    console.log('Registration request received:', { event_id, supabase_user_id: participant_id, team_name, registration_type });

    if (!event_id || !participant_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: event_id and supabase_user_id' 
      }, { status: 400 });
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ 
        error: 'Database configuration error' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for existing registration...');

    // First, we need to find the profile_id from participants_profile table using the user_id
    // The participant_id parameter is the Supabase auth user ID, we need to find the corresponding profile_id
    console.log('Looking up profile for Supabase auth user ID:', participant_id);
    
    const { data: userProfile, error: profileError } = await supabase
      .from('participants_profile')
      .select('profile_id')
      .eq('user_id', participant_id) // Find by Supabase auth user_id
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ 
        error: 'Failed to fetch user profile' 
      }, { status: 500 });
    }

    if (!userProfile) {
      console.error('User profile not found for Supabase auth user ID:', participant_id);
      return NextResponse.json({ 
        error: 'User profile not found. Please complete your profile first or contact support.' 
      }, { status: 404 });
    }

    // Use the profile_id for database operations
    const actualProfileId = userProfile.profile_id;
    console.log('Using profile_id for registration:', actualProfileId);

    // Check if the participant is already registered for this event
    // We need to check through the registrations table first, then registration_members
    const { data: existingRegistrations, error: checkRegError } = await supabase
      .from('registrations')
      .select('registration_id')
      .eq('event_id', event_id);

    if (checkRegError) {
      console.error('Error checking existing registrations:', checkRegError);
      return NextResponse.json({ 
        error: 'Failed to check existing registrations' 
      }, { status: 500 });
    }

    // Check if participant is already registered by looking through registration_members
    if (existingRegistrations && existingRegistrations.length > 0) {
      const registrationIds = existingRegistrations.map(r => r.registration_id);
      
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('registration_members')
        .select('id')
        .in('registration_id', registrationIds)
        .eq('participant_id', actualProfileId)
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        console.error('Error checking existing member:', memberCheckError);
        return NextResponse.json({ 
          error: 'Failed to check existing registration' 
        }, { status: 500 });
      }

      if (existingMember) {
        console.log('Participant already registered for this event');
        return NextResponse.json({ 
          error: 'Participant is already registered for this event' 
        }, { status: 500 });
      }
    }

    console.log('Checking event availability...');

    // Check if the event exists and get its details
    const { data: eventData, error: eventError } = await supabase
      .from('all_events')
      .select('total_participants_allowed, registered_no, registration_type')
      .eq('event_id', event_id)
      .single();

    if (eventError) {
      console.error('Error fetching event data:', eventError);
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 400 });
    }

    // Check if event is full
    if (eventData.total_participants_allowed && 
        eventData.registered_no >= eventData.total_participants_allowed) {
      console.log('Event is full');
      return NextResponse.json({ 
        error: 'Event is full. No more registrations allowed.' 
      }, { status: 400 });
    }

    // Validate team registration requirements
    if (eventData.registration_type === 'team') {
      if (!team_name || team_name.trim() === '') {
        return NextResponse.json({ 
          error: 'Team name is required for team events' 
        }, { status: 400 });
      }
      
      if (registration_type !== 'team') {
        return NextResponse.json({ 
          error: 'Registration type must be "team" for team events' 
        }, { status: 400 });
      }
    } else if (eventData.registration_type === 'individual') {
      if (registration_type && registration_type !== 'individual') {
        return NextResponse.json({ 
          error: 'Registration type must be "individual" for individual events' 
        }, { status: 400 });
      }
      // Set default registration type for individual events
      registration_type = 'individual';
    }

    console.log('Starting registration process...');

    // Start a transaction to ensure data consistency
    // First, check if a registration record already exists for this event
    let registrationId;
    
    if (existingRegistrations && existingRegistrations.length > 0) {
      // Use existing registration record
      registrationId = existingRegistrations[0].registration_id;
      console.log('Using existing registration record:', registrationId);
    } else {
      // Create a new registration record
      console.log('Creating new registration record...');
      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .insert({
          event_id: event_id,
          registration_type: registration_type,
          team_name: team_name || null, // Include team name if provided
          registered_at: new Date().toISOString()
        })
        .select()
        .single();

      if (registrationError) {
        console.error('Error creating registration:', registrationError);
        return NextResponse.json({ 
          error: 'Failed to create registration record' 
        }, { status: 500 });
      }
      
      registrationId = registration.registration_id;
      console.log('Created new registration record:', registrationId);
    }

    // Now create the registration member record using the registration_id
    console.log('Creating registration member record...');
    const { data: registrationMember, error: insertError } = await supabase
      .from('registration_members')
      .insert({
        registration_id: registrationId,
        participant_id: actualProfileId
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting registration member:', insertError);
      return NextResponse.json({ 
        error: 'Failed to register participant for event' 
      }, { status: 500 });
    }

    console.log('Registration member created successfully:', registrationMember.id);

    // Update the event's registered count
    console.log('Updating event registration count...');
    const { error: updateEventError } = await supabase
      .from('all_events')
      .update({ 
        registered_no: (eventData.registered_no || 0) + 1 
      })
      .eq('event_id', event_id);

    if (updateEventError) {
      console.error('Error updating event registration count:', updateEventError);
      // Note: We don't rollback here as the main registration was successful
      // The count can be corrected manually if needed
    } else {
      console.log('Event registration count updated successfully');
    }

    // Update the participant's registered_events_count
    console.log('Updating participant profile...');
    
    // First, get the current registered_events_count
    const { data: currentProfile, error: fetchError } = await supabase
      .from('participants_profile')
      .select('registered_events_count')
      .eq('profile_id', actualProfileId)
      .single();

    if (fetchError) {
      console.error('Error fetching current profile count:', fetchError);
      // Note: We don't rollback here as the main registration was successful
      // The count can be corrected manually if needed
    } else {
      // Update with the incremented count
      const newCount = (currentProfile?.registered_events_count || 0) + 1;
      const { error: updateProfileError } = await supabase
        .from('participants_profile')
        .update({ 
          registered_events_count: newCount
        })
        .eq('profile_id', actualProfileId);

      if (updateProfileError) {
        console.error('Error updating participant profile:', updateProfileError);
        // Note: We don't rollback here as the main registration was successful
        // The count can be corrected manually if needed
      } else {
        console.log('Participant profile updated successfully');
      }
    }

    console.log('Registration completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Participant registered successfully for event',
      registration_id: registrationMember.id,
      event_id: event_id,
      supabase_user_id: participant_id,
      profile_id: actualProfileId,
      used_existing_registration: existingRegistrations && existingRegistrations.length > 0
    });

  } catch (error) {
    console.error('Error in participant registration:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
