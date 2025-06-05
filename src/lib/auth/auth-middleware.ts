import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    image?: string | null;
}

// Overloaded function signatures to support both patterns
export function requireAuth(
    handler: (req: NextRequest, user: AuthenticatedUser, context?: unknown) => Promise<NextResponse>
): (req: NextRequest, context?: unknown) => Promise<NextResponse>;

export function requireAuth(
    req: NextRequest,
    handler: (user: AuthenticatedUser) => Promise<NextResponse>
): Promise<NextResponse>;

export function requireAuth(
    handlerOrReq: ((req: NextRequest, user: AuthenticatedUser, context?: unknown) => Promise<NextResponse>) | NextRequest,
    handler?: (user: AuthenticatedUser) => Promise<NextResponse>
): ((req: NextRequest, context?: unknown) => Promise<NextResponse>) | Promise<NextResponse> {
    // Pattern 2: requireAuth(request, handler)
    if (handlerOrReq instanceof Request && handler) {
        return authenticateAndCall(handlerOrReq as NextRequest, (req, user) => handler(user));
    }
    
    // Pattern 1: requireAuth(handler) - returns a function
    const wrappedHandler = handlerOrReq as (req: NextRequest, user: AuthenticatedUser, context?: unknown) => Promise<NextResponse>;
    return async (req: NextRequest, context?: unknown): Promise<NextResponse> => {
        return authenticateAndCall(req, (request, user) => wrappedHandler(request, user, context));
    };
}

async function authenticateAndCall(
    req: NextRequest,
    handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized: Please sign in to continue" },
                { status: 401 }
            );
        }

        const user: AuthenticatedUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.name || "",
            image: session.user.image
        };

        return handler(req, user);
    } catch (error) {
        console.error("Auth middleware error:", error);
        return NextResponse.json(
            { error: "Internal server error during authentication" },
            { status: 500 }
        );
    }
} 