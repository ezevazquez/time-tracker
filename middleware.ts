import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/auth/callback',
  '/auth/auth-code-error',
  '/unauthorized',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Excluir rutas públicas
  const isPublic = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))

  const access_token = req.cookies.get('sb-access-token')

  if (!isPublic && !access_token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], // proteger todo excepto archivos internos
}
