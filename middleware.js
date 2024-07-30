import { updateSession } from "@/utils/supabase/middleware";

/**
 * Middleware to handle session updates.
 *
 * This middleware function calls the `updateSession` function
 * to manage and refresh user sessions.
 *
 * @param {Request} request - The incoming request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object.
 */
export const middleware = async (request) => {
  return updateSession(request);
};

/**
 * Configuration for the middleware matcher.
 *
 * This configuration object defines the request paths that the middleware
 * should apply to. It excludes paths starting with `_next/static`, `_next/image`,
 * and `favicon.ico`, as well as requests for common image file types.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
