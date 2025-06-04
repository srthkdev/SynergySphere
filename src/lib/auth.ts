import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { env } from "@/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: { 
    enabled: true, 
  }, 
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [nextCookies()], 
  secret: env.BETTER_AUTH_SECRET || "your-secret-key-here",
  baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
});
