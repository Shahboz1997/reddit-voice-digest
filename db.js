const postgres = require("postgres");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

/** Supabase pooler (session mode on :5432 or transaction on :6543). */
const sql = postgres(connectionString, {
  ssl: "require",
  max: 1,
});

module.exports = sql;
module.exports.default = sql;
