import { supabase } from './supabase';

export async function insertUserToCustomTable(userId, username, role) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          username: username,
          role: role,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error inserting user to custom table:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in insertUserToCustomTable:', error);
    throw error;
  }
}

export async function getUserFromCustomTable(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user from custom table:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserFromCustomTable:', error);
    throw error;
  }
}
