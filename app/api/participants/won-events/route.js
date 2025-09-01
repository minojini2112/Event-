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

    console.log('Fetching won events for user:', user_id);

    // Debug: Show all users and their registration counts
    console.log('=== DEBUGGING: Checking all users and their registrations ===');
    
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, username, role');
    
    if (usersError) {
      console.error('Error fetching all users:', usersError);
    } else {
      console.log('All users in system:', allUsers);
      
      // Check registration counts for each user
      for (const user of allUsers || []) {
        const { data: userRegistrations, error: regError } = await supabase
          .from('registration_members')
          .select('registration_id')
          .eq('participant_id', user.id);
        
        if (!regError) {
          console.log(`User ${user.username} (${user.id}): ${userRegistrations?.length || 0} registrations`);
        }
      }
    }
    
    console.log('=== END DEBUGGING ===');

    // Step 1: Get the participant's username from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const username = userData.username;
    console.log('Using username:', username);

    // Step 2: Get all registration memberships for this user
    console.log('=== STEP 2: Checking registration_members for user_id:', user_id, '===');
    
    // First, get basic registration_members data without joins
    const { data: basicMemberships, error: basicError } = await supabase
      .from('registration_members')
      .select('*')
      .eq('participant_id', user_id);
    
    if (basicError) {
      console.error('Error fetching basic memberships:', basicError);
    } else {
      console.log('Basic registration_members found:', basicMemberships?.length || 0);
      if (basicMemberships && basicMemberships.length > 0) {
        console.log('Sample basic membership:', basicMemberships[0]);
      }
    }
    
    // Now try with joins
    const { data: registrationMemberships, error: membershipsError } = await supabase
      .from('registration_members')
      .select(`
        registration_id,
        registrations!inner (
          event_id,
          registration_type,
          team_name,
          all_events!inner (
            event_id,
            event_name,
            start_date,
            end_date,
            description,
            caption,
            image_url
          )
        )
      `)
      .eq('participant_id', user_id);

    if (membershipsError) {
      console.error('Error fetching registration memberships:', membershipsError);
      return NextResponse.json(
        { error: 'Failed to fetch registration memberships' },
        { status: 500 }
      );
    }

    if (!registrationMemberships || registrationMemberships.length === 0) {
      console.log('No registrations found for user');
      return NextResponse.json({
        success: true,
        events: [],
        count: 0,
        message: 'No registrations found for this user'
      });
    }

    console.log(`Found ${registrationMemberships.length} registrations for user`);

    // Step 3: Get all events where the participant has registrations
    const eventIds = registrationMemberships
      .map(membership => membership.registrations?.all_events?.event_id)
      .filter(Boolean);

    if (eventIds.length === 0) {
      console.log('No valid events found in registrations');
      return NextResponse.json({
        success: true,
        events: [],
        count: 0,
        message: 'No valid events found in registrations'
      });
    }

    // Step 4: Check past_events table for winners
    const { data: pastEvents, error: pastEventsError } = await supabase
      .from('past_events')
      .select(`
        event_id,
        winners,
        all_events!inner (
          event_id,
          event_name,
          start_date,
          end_date,
          description,
          caption,
          image_url
        )
      `)
      .in('event_id', eventIds);

    if (pastEventsError) {
      console.error('Error fetching past events:', pastEventsError);
      return NextResponse.json(
        { error: 'Failed to fetch past events' },
        { status: 500 }
      );
    }

    if (!pastEvents || pastEvents.length === 0) {
      console.log('No past events found for user registrations');
      return NextResponse.json({
        success: true,
        events: [],
        count: 0,
        message: 'No past events found for user registrations'
      });
    }

    console.log(`Found ${pastEvents.length} past events to check for winners`);

    // Step 5: Filter events where the participant is a winner
    const wonEvents = [];

    // Debug: Log the first past event to see the structure
    if (pastEvents.length > 0) {
      console.log('Sample past event structure:', {
        event_id: pastEvents[0].event_id,
        winners: pastEvents[0].winners,
        winners_type: typeof pastEvents[0].winners,
        username: username
      });
    }

    for (const pastEvent of pastEvents) {
      const event = pastEvent.all_events;
      const winners = pastEvent.winners;
      
      if (!event || !winners) continue;

      // Check if participant is a winner
      let isWinner = false;

      // Parse winners if it's a JSON string
      let parsedWinners = winners;
      if (typeof winners === 'string') {
        try {
          parsedWinners = JSON.parse(winners);
        } catch (parseError) {
          console.error('Error parsing winners JSON:', parseError);
          continue; // Skip this event if parsing fails
        }
      }

      // Find the registration for this event
      const userRegistration = registrationMemberships.find(membership => 
        membership.registrations?.event_id === event.event_id
      );

      if (userRegistration) {
        const registrationType = userRegistration.registrations?.registration_type;

        if (registrationType === 'team') {
          // For team events, check if team_name is in winners
          const teamName = userRegistration.registrations?.team_name;
          if (teamName) {
            if (Array.isArray(parsedWinners) && parsedWinners.includes(teamName)) {
              isWinner = true;
            } else if (typeof parsedWinners === 'object' && parsedWinners.team_winners) {
              // If winners is structured as { team_winners: [team_names] }
              if (Array.isArray(parsedWinners.team_winners) && parsedWinners.team_winners.includes(teamName)) {
                isWinner = true;
              }
            }
          }
        } else {
          // For individual events, check if username is in winners
          if (Array.isArray(parsedWinners) && parsedWinners.includes(username)) {
            isWinner = true;
          } else if (typeof parsedWinners === 'object' && parsedWinners.individual_winners) {
            // If winners is structured as { individual_winners: [usernames] }
            if (Array.isArray(parsedWinners.individual_winners) && parsedWinners.individual_winners.includes(username)) {
              isWinner = true;
            }
          }
        }
      }

      if (isWinner) {
        wonEvents.push({
          id: event.event_id,
          title: event.event_name,
          start_date: event.start_date,
          end_date: event.end_date,
          description: event.description,
          caption: event.caption,
          image_url: event.image_url,
          registration_type: userRegistration?.registrations?.registration_type || 'unknown',
          won_as: userRegistration?.registrations?.registration_type === 'team' ? 'team' : 'individual'
        });
      }
    }

    console.log(`User ${username} (${user_id}) has won ${wonEvents.length} events`);

    return NextResponse.json({
      success: true,
      events: wonEvents,
      count: wonEvents.length,
      message: wonEvents.length > 0 ? 'Events won by participant' : 'No events won yet'
    });

  } catch (error) {
    console.error('Error fetching won events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch won events' },
      { status: 500 }
    );
  }
}
