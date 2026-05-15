/**
 * Quick check: postgres.js + DATABASE_URL from .env.local (via --env-file).
 * Run: npm run db:check
 */
const path = require("node:path");

process.chdir(path.join(__dirname, ".."));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Use: npm run db:check (loads .env.local via --env-file).");
  process.exit(1);
}

const sql = require("../db.js");

async function main() {
  const rows = await sql`select current_database() as db, current_user as role`;
  console.log("OK:", rows);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
