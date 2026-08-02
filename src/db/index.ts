import mysql from "mysql2/promise";

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

export const db = poolConnection;
export type DB = typeof db;
