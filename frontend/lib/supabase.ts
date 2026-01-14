// Supabase is disabled for now
// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';
const supabaseAnonKey = '';

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabase = null;

/**
 * Sign in with Google OAuth - DISABLED
 */
export const signInWithGoogle = async () => {
  console.log('Supabase Google OAuth is disabled');
  return null;
};

/**
 * Get current session - DISABLED
 */
export const getSession = async () => {
  return null;
};

/**
 * Sign out - DISABLED
 */
export const signOut = async () => {
  console.log('Supabase sign out is disabled');
};
