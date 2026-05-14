import "../lib/load-env";

import { runDigestPipeline } from "../lib/pipeline/run-digest-pipeline";

function parseArgs() {
  const args = process.argv.slice(2);
  const subredditsArg = args.find((arg) => arg.startsWith("--subreddits="));
  const dateArg = args.find((arg) => arg.startsWith("--date="));

  return {
    selectedSubreddits: subredditsArg
      ? subredditsArg
          .replace("--subreddits=", "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
    runDate: dateArg ? new Date(dateArg.replace("--date=", "")) : undefined,
  };
}

async function main() {
  const result = await runDigestPipeline(parseArgs());
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
