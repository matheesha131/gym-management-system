import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/db/schema/auth.ts", "./src/db/schema/domain.ts"],
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || "irwtn",
    password: process.env.DATABASE_PASSWORD || "DeadReckoning@2023",
    database: process.env.DATABASE_NAME || "gym_management",
  },
});
