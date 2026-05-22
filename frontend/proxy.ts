import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/report', '/track', '/verify-qr', '/terms', '/privacy', '/forgot-password'];

// Route patterns for role-based access
const roleRoutes = {
  athlete: ['/profile', '/documents', '/verifications', '/credentials'],
  federation: ['/verification-requests', '/members'],
  admin: ['/audit-logs', '/metrics'],
  investigator: ['/audit-logs'],
};

// Shared routes accessible by multiple roles
const sharedRoutes = {
  '/dashboard': ['athlete', 'federation', 'admin', 'investigator', 'coach'],
  '/reports': ['athlete', 'admin', 'investigator'],
};

// Helper function to decode JWT payload (without verification - just for role extraction)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Helper function to check if user has access to route
function hasRouteAccess(pathname: string, userRoles: string[]): boolean {
  // Check shared routes first
  for (const [route, allowedRoles] of Object.entries(sharedRoutes)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return userRoles.some(role => allowedRoles.includes(role.toLowerCase()));
    }
  }

  // Check role-specific routes
  for (const [role, routes] of Object.entries(roleRoutes)) {
    if (userRoles.some(r => r.toLowerCase() === role)) {
      if (routes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        return true;
      }
    }
  }

  return false;
}

// Helper function to get role-appropriate home page
function getRoleHomePage(userRoles: string[]): string {
  if (userRoles.includes('ATHLETE')) return '/dashboard';
  if (userRoles.includes('FEDERATION')) return '/dashboard';
  if (userRoles.includes('ADMIN')) return '/dashboard';
  if (userRoles.includes('INVESTIGATOR')) return '/dashboard';
  if (userRoles.includes('COACH')) return '/dashboard';
  return '/';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authentication token (Access_Token cookie)
  const accessToken = request.cookies.get('Access_Token');

  // Redirect to login if not authenticated
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode token to get user roles
  const payload = decodeJWT(accessToken.value);
  
  if (!payload || !payload.roles) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const userRoles: string[] = Array.isArray(payload.roles) ? payload.roles : [payload.roles];

  // Check if user has access to the requested route
  if (!hasRouteAccess(pathname, userRoles)) {
    // User doesn't have access, redirect to their role-appropriate home
    const homeUrl = new URL(getRoleHomePage(userRoles), request.url);
    homeUrl.searchParams.set('error', 'access_denied');
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
