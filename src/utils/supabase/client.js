import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for the browser.
 *
 * This function reads the Supabase URL and ANON KEY from environment variables
 * and uses them to create a browser client instance.
 *
 * @throws {Error} Throws an error if the Supabase URL or ANON KEY is missing.
 * @returns {SupabaseClient} A Supabase client instance configured for the browser.
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or ANON KEY");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
