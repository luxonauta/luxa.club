import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a Supabase client for the server with cookie management.
 *
 * This function reads the Supabase URL and ANON KEY from environment variables
 * and uses them to create a server client instance. It also handles the management
 * of cookies for authentication and session purposes.
 *
 * @throws {Error} Throws an error if the Supabase URL or ANON KEY is missing.
 * @returns {SupabaseClient} A Supabase client instance configured for the server.
 */
export const createClient = () => {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or ANON KEY");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch (error) {
          console.error("Failed to set cookies:", error);
        }
      }
    }
  });
};
