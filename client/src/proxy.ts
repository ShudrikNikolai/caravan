import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function proxy(req: NextRequest) {
  const hasToken = req.cookies.has('access_token');
  const isPublicPath = PUBLIC_PATHS.includes(req.nextUrl.pathname);

  if (!hasToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (hasToken && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
