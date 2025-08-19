import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // Get user_id from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
    
    // Fetch profile details by user_id
    // Note: participants_profile table uses 'profile_id' (auto-generated UUID) and 'user_id' (Supabase auth ID)
    const { data: profileData, error: profileError } = await supabase
      .from('participants_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch user email from auth.users table
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile from database' },
        { status: 500 }
      );
    }

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Combine profile and user data
    const result = {
      profile: profileData || null,
      user: {
        email: userData.user?.email || null,
        username: userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'User'
      },
      // Add clear ID mapping for debugging
      id_mapping: {
        profile_id: profileData?.profile_id || null,
        user_id: userId,
        supabase_auth_id: userId
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      name, 
      college_name, 
      department, 
      register_number, 
      year 
    } = body;

    // Validate required fields
    if (!user_id || !name || !college_name || !department || !register_number || !year) {
      return NextResponse.json(
        { error: 'All fields are required: user_id, name, college_name, department, register_number, year' },
        { status: 400 }
      );
    }

    // Validate year constraint (1-6)
    if (year < 1 || year > 6) {
      return NextResponse.json(
        { error: 'Year must be between 1 and 6' },
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

    // Check if profile already exists for this user
    // Note: participants_profile table uses 'profile_id' (auto-generated UUID) and 'user_id' (Supabase auth ID)
    const { data: existingProfile, error: checkError } = await supabase
      .from('participants_profile')
      .select('profile_id')
      .eq('user_id', user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing profile' },
        { status: 500 }
      );
    }

    let result;
    if (existingProfile) {
      // Update existing profile - only allow editing of specified fields
      const { data, error } = await supabase
        .from('participants_profile')
        .update({
          name,
          college_name,
          department,
          register_number,
          year,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      result = { profile: data, action: 'updated' };
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('participants_profile')
        .insert({
          user_id,
          name,
          college_name,
          department,
          register_number,
          year,
          registered_events_count: 0,
          won_events_count: 0,
          wishlisted_events_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      result = { profile: data, action: 'created' };
    }

    // Add clear ID mapping for debugging
    result.id_mapping = {
      profile_id: result.profile?.profile_id || null,
      user_id: user_id,
      supabase_auth_id: user_id
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
