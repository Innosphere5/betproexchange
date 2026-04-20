import { NextResponse } from 'next/server';

// Routes that are always public (no auth needed)
const PUBLIC_PATHS = ['/login'];

// Routes only admins can access
const ADMIN_PATHS = ['/admin'];

// Routes only masters can access
const MASTER_PATHS = ['/master'];

// Routes only users (non-admin/non-master) can access
const USER_PATHS = ['/dashboard'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

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

  // No session — redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let session;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    // Corrupt cookie — clear it and redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('user_session');
    return response;
  }

  const role = session?.role;

  // Admin trying to access other panels → allow only /admin
  if (role === 'admin') {
    if (USER_PATHS.some((p) => pathname.startsWith(p)) || MASTER_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Master trying to access other panels → allow only /master
  if (role === 'master') {
    if (USER_PATHS.some((p) => pathname.startsWith(p)) || ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/master/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Regular User trying to access admin/master panel → redirect to dashboard
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) || MASTER_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
