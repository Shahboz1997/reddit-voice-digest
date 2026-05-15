/**
 * Idempotent prisma baseline: `migrate resolve --applied` fails with P3008 if already recorded.
 * Treat that case as success so `npm run prisma:baseline` is safe to run multiple times.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.join(__dirname, "..");

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "resolve", "--applied", "20260514000000_baseline"],
  {
    cwd: root,
    shell: true,
    encoding: "utf8",
  },
);

const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
const combined = `${stdout}${stderr}`;

if (stdout) process.stdout.write(stdout);
if (stderr) process.stderr.write(stderr);

if (result.status === 0) {
  process.exit(0);
}

if (/P3008|already recorded as applied/i.test(combined)) {
  console.log("\nBaseline migration was already recorded — nothing to do.");
  process.exit(0);
}

process.exit(result.status ?? 1);
