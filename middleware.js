import { NextResponse } from 'next/server';

// Routes only superadmins can access
const SUPERADMIN_PATHS = ['/superadmin'];
// Routes only admins can access
const ADMIN_PATHS = ['/admin'];
// Routes only supermasters can access
const SUPERMASTER_PATHS = ['/supermaster'];
// Routes only masters can access
const MASTER_PATHS = ['/master'];
// Routes only users (non-admin/non-master) can access
const USER_PATHS = ['/dashboard'];

function getRoleLandingUrl(role, requestUrl) {
  if (role === 'superadmin') return new URL('/superadmin/users', requestUrl);
  if (role === 'admin') return new URL('/admin/users', requestUrl);
  if (role === 'supermaster') return new URL('/supermaster/users', requestUrl);
  if (role === 'master') return new URL('/master/users', requestUrl);
  return new URL('/dashboard', requestUrl);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static files through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Read session cookie
  const sessionCookie = request.cookies.get('user_session')?.value;

  let session = null;
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      session = null;
    }
  }

  // If user is accessing /login or /
  if (pathname === '/login' || pathname === '/') {
    if (session?.role) {
      // Already logged in — redirect to role landing page
      return NextResponse.redirect(getRoleLandingUrl(session.role, request.url));
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // No session for protected routes — redirect to login
  if (!session || !session.token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) {
      response.cookies.delete('user_session');
    }
    return response;
  }

  const role = session.role;

  // Superadmin trying to access other panels → redirect to /superadmin/users
  if (role === 'superadmin') {
    if (USER_PATHS.some((p) => pathname.startsWith(p)) || ADMIN_PATHS.some((p) => pathname.startsWith(p)) || SUPERMASTER_PATHS.some((p) => pathname.startsWith(p)) || MASTER_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/superadmin/users', request.url));
    }
    return NextResponse.next();
  }

  // Admin trying to access other panels → redirect to /admin/users
  if (role === 'admin') {
    if (USER_PATHS.some((p) => pathname.startsWith(p)) || SUPERMASTER_PATHS.some((p) => pathname.startsWith(p)) || MASTER_PATHS.some((p) => pathname.startsWith(p)) || SUPERADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin/users', request.url));
    }
    return NextResponse.next();
  }

  // Supermaster trying to access other panels → redirect to /supermaster/users
  if (role === 'supermaster') {
    if (USER_PATHS.some((p) => pathname.startsWith(p)) || ADMIN_PATHS.some((p) => pathname.startsWith(p)) || MASTER_PATHS.some((p) => pathname.startsWith(p)) || SUPERADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/supermaster/users', request.url));
    }
    return NextResponse.next();
  }

  // Master trying to access other panels → redirect to /master/users
  if (role === 'master') {
    if (USER_PATHS.some((p) => pathname.startsWith(p)) || ADMIN_PATHS.some((p) => pathname.startsWith(p)) || SUPERMASTER_PATHS.some((p) => pathname.startsWith(p)) || SUPERADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/master/users', request.url));
    }
    return NextResponse.next();
  }

  // Regular User trying to access privileged panels → redirect to /dashboard
  if (SUPERADMIN_PATHS.some((p) => pathname.startsWith(p)) || ADMIN_PATHS.some((p) => pathname.startsWith(p)) || SUPERMASTER_PATHS.some((p) => pathname.startsWith(p)) || MASTER_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
