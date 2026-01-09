import { createClient } from '@supabase/supabase-js';
import Config from '../config';

const supabaseUrl = Config.supabaseUrl;
const supabaseAnonKey = Config.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
