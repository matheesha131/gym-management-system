import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as authSchema from "./schema/auth";
import * as domainSchema from "./schema/domain";

export const schema = {
  ...authSchema,
  ...domainSchema,
};

const poolConnection = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "radius",
  database: process.env.DATABASE_NAME || "gym_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });
export type DB = typeof db;
