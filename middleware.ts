
// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const adminPath = "/app"
  const apiAdminPath = "/api/app"

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    console.log("middleware: no session found")

    if (req.nextUrl.pathname.startsWith(apiAdminPath)) {
      return new NextResponse(
        JSON.stringify({ message: "authorization failed" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (req.nextUrl.pathname.startsWith(adminPath)) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/login"
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ["/api/app/:path*", "/app/:path*"],
