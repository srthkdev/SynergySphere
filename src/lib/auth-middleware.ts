import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { session, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get session token from cookie or Authorization header
    const sessionToken = request.cookies.get('session-token')?.value || 
                        request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return null;
    }

    // Find valid session
    const [sessionData] = await db
      .select({
        userId: session.userId,
        expiresAt: session.expiresAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .where(eq(session.token, sessionToken))
      .limit(1);

    if (!sessionData) {
      return null;
    }

    // Check if session is expired
    if (sessionData.expiresAt < new Date()) {
      // Clean up expired session
      await db.delete(session).where(eq(session.token, sessionToken));
      return null;
    }

    return {
      id: sessionData.userId,
      name: sessionData.userName,
      email: sessionData.userEmail,
    };
  } catch (error) {
    console.error("Error authenticating user:", error);
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return handler(request, user, context);
  };
} 