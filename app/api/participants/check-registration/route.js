import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const participant_id = searchParams.get('participant_id');

    console.log('Check registration request:', { event_id, supabase_user_id: participant_id });

    if (!event_id || !participant_id) {
      return NextResponse.json({ 
        error: 'Missing required parameters: event_id and supabase_user_id' 
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

    console.log('Checking for existing registration record...');

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
    console.log('Using profile_id for registration check:', actualProfileId);

    // Check if the participant is registered for this event
    // First, find the registration record for this event
    const { data: registration, error: registrationError } = await supabase
      .from('registrations')
      .select('registration_id')
      .eq('event_id', event_id)
      .single();

    if (registrationError && registrationError.code !== 'PGRST116') {
      console.error('Error finding registration:', registrationError);
      return NextResponse.json({ 
        error: 'Failed to check registration status' 
      }, { status: 500 });
    }

    if (!registration) {
      console.log('No registration record found for event');
      // No registration record exists for this event
      return NextResponse.json({ 
        isRegistered: false,
        event_id,
        supabase_user_id: participant_id,
        profile_id: null,
        registration_id: null,
        has_registration_record: false
      });
    }

    console.log('Found registration record:', registration.registration_id);

    // Now check if the participant is linked to this registration
    const { data: registrationMember, error: memberError } = await supabase
      .from('registration_members')
      .select('id')
      .eq('registration_id', registration.registration_id)
      .eq('participant_id', actualProfileId) // Use actualProfileId here
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Error checking registration member:', memberError);
      return NextResponse.json({ 
        error: 'Failed to check registration status' 
      }, { status: 500 });
    }

    const isRegistered = !!registrationMember;
    console.log('Registration status:', { isRegistered, supabase_user_id: participant_id, profile_id: actualProfileId, event_id });

    return NextResponse.json({ 
      isRegistered,
      event_id,
      supabase_user_id: participant_id,
      profile_id: actualProfileId,
      registration_id: registration.registration_id,
      has_registration_record: true
    });

  } catch (error) {
    console.error('Error in check registration:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
