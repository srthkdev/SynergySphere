import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/lib/db";
import { env } from "@/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: { 
    enabled: true,
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
  }, 
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [nextCookies()], 
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
}); 