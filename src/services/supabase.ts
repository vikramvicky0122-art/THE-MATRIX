import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// -----------------------------------------------------------------------------
// Environment Variables
// These are loaded from your .env file via Vite.
// -----------------------------------------------------------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Singleton Supabase client.
 * 
 * How to use anywhere in the app:
 *   import { supabase } from "@/services/supabase";
 * 
 * Configured with:
 * - Session persistance via localStorage
 * - Automatic token refresh on expiry
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
    },
});
