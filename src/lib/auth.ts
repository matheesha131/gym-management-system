import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "gym-management-secret-key-development",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "member",
        required: false,
      },
    },
  },
});
