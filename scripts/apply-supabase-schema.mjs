import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local is optional when DATABASE_URL is already exported.
  }
}

async function runSql(client, file) {
  const sql = readFileSync(resolve(file), "utf8");
  await client.query(sql);
  console.log(`Applied ${file}`);
}

loadEnvFile(resolve(".env.local"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add it to .env.local or export it before running npm run db:push.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  await runSql(client, "supabase/schema.sql");
  await runSql(client, "supabase/seed.sql");
  console.log("Supabase schema is ready.");
} finally {
  await client.end();
}
