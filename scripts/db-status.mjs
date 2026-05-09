import { spawnSync } from "node:child_process";

const result = spawnSync("supabase", ["status"], {
  encoding: "utf8"
});

if (result.error) {
  console.log("Supabase CLI local stack status could not be inspected in this environment.");
  process.exit(0);
}

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status === 0) {
  process.exit(0);
}

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const knownEnvironmentFailures = [
  "dockerDesktopLinuxEngine",
  "The system cannot find the file specified",
  "supabase' is not recognized",
  "supabase is not recognized",
  "No such file or directory"
];

if (knownEnvironmentFailures.some((pattern) => output.includes(pattern))) {
  console.log("Supabase CLI local stack status could not be inspected in this environment.");
  process.exit(0);
}

process.exit(result.status ?? 1);
