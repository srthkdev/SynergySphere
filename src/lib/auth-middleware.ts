import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    try {
      const user = await getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      return handler(request, user, context);
    } catch (error) {
      console.error("Error authenticating user:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  };
} 