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
  providers: {
    credentials: {
      authorize: async ({ email, password }: { email: string; password: string }) => {
        // In a real implementation, you would validate the credentials against your database
        // For now, just accept any email/password combination for testing
        if (email && password) {
          return {
            id: "123",
            email,
            name: email.split("@")[0],
          };
        }
        
        return null;
      },
    }
  },
  socialProviders: {
    // github: {
    //   clientId: env.GITHUB_CLIENT_ID,
    //   clientSecret: env.GITHUB_CLIENT_SECRET,
    // },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    // discord: {
    //   clientId: env.DISCORD_CLIENT_ID,
    //   clientSecret: env.DISCORD_CLIENT_SECRET,
    // }
  },
  plugins: [nextCookies()]
});
