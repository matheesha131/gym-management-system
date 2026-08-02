import { betterAuth } from "better-auth";
import mysql from "mysql2/promise";

const poolConnection = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "gym_management",
});

const auth = betterAuth({
  database: poolConnection,
});
console.log("Auth configured successfully", !!auth);
