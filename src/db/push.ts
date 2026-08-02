import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";

async function push() {
  console.log("Pushing database schema...");
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "radius",
    database: process.env.DATABASE_NAME || "gym_management",
    multipleStatements: true,
  });

  const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
  const sql = await fs.readFile(schemaPath, "utf-8");

  await pool.query(sql);
  console.log("Schema applied successfully.");
  await pool.end();
}

push().catch((err) => {
  console.error("Failed to push schema:", err);
  process.exit(1);
});
