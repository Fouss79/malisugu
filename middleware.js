import { NextResponse } from "next/server";

export function middleware(request) {
  console.log("MIDDLEWARE RUNNING 🔥");

  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  const url = request.nextUrl;

  // 🔒 non connecté
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🔥 SUPER ADMIN
  if (url.pathname.startsWith("/dashboard/superadmin")) {
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};