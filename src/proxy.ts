import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/', 
  '/sign-in', 
  '/sign-up', 
  '/denied', 
  '/checkout', 
  '/api/checkout',
  '/api/auth/session',
  // Auth endpoints that must work without an existing session cookie
  '/api/auth/signup',
  '/api/auth/otp/send',
  '/api/auth/otp/verify',
  '/api/auth/otp/password-reset/send',
  '/api/auth/otp/password-reset/verify',
];

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // 1. Allow Public Routes (Regex-like check for exact match or starting with)
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    // If authenticated and hitting sign-in/up, redirect to home
    if (session && (pathname === '/sign-in' || pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect All Other Routes
  if (!session) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

export default proxy;
