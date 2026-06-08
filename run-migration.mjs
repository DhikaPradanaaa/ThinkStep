import { createClient } from '@libsql/client';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !authToken) {
  console.error("Missing TURSO credentials");
  process.exit(1);
}

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

const sql = fs.readFileSync('migrate-oauth.sql', 'utf-8');

async function run() {
  try {
    console.log("Pushing OAuth schema to Turso...");
    await client.executeMultiple(sql);
    console.log("OAuth Schema successfully pushed to Turso!");
  } catch (error) {
    console.error("Error pushing schema:", error);
  }
}

run();
