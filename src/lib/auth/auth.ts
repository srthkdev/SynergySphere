import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import  db  from "@/lib/db"; // your drizzle instance
import {user, session, account, verification} from "@/lib/db/schema"
import { nextCookies } from "better-auth/next-js";


const schema = {
    user,
    session,
    account,
    verification,
}

// Ensure we have a database connection
if (!db) {
    throw new Error('Database connection is required for authentication');
}

// Configure social providers only if credentials are available
const socialProviders: any = {};

// Always include Google if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
}

// Only include GitHub if credentials are available
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
}

export const auth = betterAuth({

    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema ,// or "mysql", "sqlite"
    }),

    emailAndPassword: {  
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 8,   
        maxPasswordLength: 128,
        sendResetPassword: async ({user, url}) => {
            const { sendEmail } = await import("@/lib/email");
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                html: `
                <p>You requested a password reset.</p>
                <p>Please click the link below to reset your password.</p>
                <a href="${url}">Reset Password</a>
                <hr/>
                <p>If you did not request a password reset, please ignore this email.</p>
                `
            })
        },
        resetPasswordTokenExpiresIn: 3600,// token expires in1 hour
    },
    account: {
        accountLinking: {
            enabled: true,
        },
    },
    socialProviders,
   
    plugins: [nextCookies()],
});