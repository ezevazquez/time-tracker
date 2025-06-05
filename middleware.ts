import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/app', '/people', '/admin']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Detectar si la ruta está protegida
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))

  // ⚠️ Supabase guarda cookies como sb-access-token y sb-refresh-token
  const access_token = req.cookies.get('sb-access-token')

  if (isProtected && !access_token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configuración del matcher
export const config = {
  matcher: ['/app/:path*', '/people/:path*', '/admin/:path*'],
}
