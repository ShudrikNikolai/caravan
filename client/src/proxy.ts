import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const SENSITIVE_QUERY_KEYS = [
  'email',
  'password',
  'confirmPassword',
  'oldpass',
  'newpass',
  'token',
  'access_token',
  'refresh_token',
  'accessToken',
  'refreshToken',
];

export function proxy(req: NextRequest) {
  const hasSensitiveQuery = SENSITIVE_QUERY_KEYS.some((key) =>
    req.nextUrl.searchParams.has(key),
  );

  if (hasSensitiveQuery) {
    const cleanUrl = req.nextUrl.clone();

    SENSITIVE_QUERY_KEYS.forEach((key) => {
      cleanUrl.searchParams.delete(key);
    });

    return NextResponse.redirect(cleanUrl);
  }

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
