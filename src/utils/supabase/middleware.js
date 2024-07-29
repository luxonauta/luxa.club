import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Update the Supabase session based on the incoming request.
 *
 * This function creates a Supabase server client with cookie management
 * for handling authentication and session management. If the user is not
 * authenticated and is not on the sign-in page, they will be redirected
 * to the sign-in page.
 *
 * @param {Request} request - The incoming request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object.
 */
export const updateSession = async (request) => {
  let supabaseResponse = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith("/account")) {
    const url = request.nextUrl.clone();
    url.pathname = "/account/sign-in";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
