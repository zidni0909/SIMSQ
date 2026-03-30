import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const roleRouteMap: Record<string, string[]> = {
  '/admin/sarpras': ['admin', 'sarpras', 'kepala_sekolah'],
  '/admin/perpustakaan': ['admin', 'perpus', 'kepala_sekolah'],
  '/admin/users': ['admin'],
  '/admin/settings': ['admin'],
  '/admin/audit-log': ['admin'],
  '/admin/backup': ['admin'],
  '/admin/laporan': ['admin', 'kepala_sekolah'],
  '/admin/dashboard': ['admin', 'sarpras', 'perpus', 'kepala_sekolah'],
  '/admin/portal': ['admin', 'sarpras', 'perpus', 'kepala_sekolah'],
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Redirect root to portal
  if (pathname === '/' || pathname === '/admin') {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (token) {
      return NextResponse.redirect(new URL('/admin/portal', request.url))
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Role-based access control
    const userRole = token.role as string
    for (const [route, roles] of Object.entries(roleRouteMap)) {
      if (pathname.startsWith(route) && !roles.includes(userRole)) {
        return NextResponse.redirect(new URL('/admin/portal', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*']
}
