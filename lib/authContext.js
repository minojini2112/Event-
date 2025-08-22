'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getUserFromCustomTable } from './userUtils';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // Clear potentially corrupted session
          await supabase.auth.signOut();
        }
        if (session?.user) {
          await fetchUserRole(session.user.id);
          setUser(session.user);
        }
      } catch (e) {
        console.error('Error getting initial session:', e);
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            await fetchUserRole(session.user.id);
            setUser(session.user);
          } else {
            setUser(null);
            setUserRole(null);
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const userData = await getUserFromCustomTable(userId);
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('participant'); // Default fallback
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signOut,
    fetchUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
