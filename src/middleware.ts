import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/projects", "/tasks", "/my-tasks", "/analytics", "/settings", "/team", "/budgets", "/inbox", "/documents"];
const authRoutes = ["/login", "/sign-up", "/sign-in", "/forgot-password", "/reset-password"];
const apiRoutes = ["/api/projects", "/api/tasks", "/api/comments", "/api/notifications", "/api/analytics"];

export async function middleware(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const { pathname } = request.nextUrl;

    // If user is authenticated but trying to access auth routes (e.g., /sign-in, /sign-up)
    if (session && authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user is not authenticated and trying to access a protected route
    if (!session && (
        protectedRoutes.some(route => pathname.startsWith(route)) ||
        apiRoutes.some(route => pathname.startsWith(route))
    )) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
