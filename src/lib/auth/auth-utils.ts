import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
}

export async function getUser(): Promise<User | null> {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        
        if (!session || !session.user) {
            return null;
        }

        return {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.name || "",
            image: session.user.image
        };
    } catch (error) {
        console.error("Error getting user:", error);
        return null;
    }
}

export async function requireUser(): Promise<User> {
    const user = await getUser();
    if (!user) {
        throw new Error("User not authenticated");
    }
    return user;
} 