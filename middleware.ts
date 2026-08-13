import { readCookie, verifySession, SESSION_COOKIE_NAME } from './lib/session'

export const config = {
  matcher: ['/', '/demo1/:path*', '/demo2/:path*', '/demo3/:path*', '/demo4/:path*', '/admin/:path*', '/how-its-built/:path*'],
}

export default async function middleware(request: Request) {
  const cookieHeader = request.headers.get('cookie') || undefined
  const token = readCookie(cookieHeader, SESSION_COOKIE_NAME)
  const session = token ? await verifySession(token) : null
  const url = new URL(request.url)

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', url.pathname)
    return Response.redirect(loginUrl, 302)
  }

  if (url.pathname.startsWith('/admin') && session.role !== 'admin') {
    return Response.redirect(new URL('/', request.url), 302)
  }

  return undefined
}
