#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const dashboardDataPath = join(repoRoot, ".agents", "harness", "dashboard", "data", "runs.js");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readDashboardData() {
  if (!existsSync(dashboardDataPath)) {
    throw new Error(`Dashboard data not found: ${dashboardDataPath}`);
  }

  const text = readFileSync(dashboardDataPath, "utf8").trim();
  const prefix = "window.AI_HARNESS_RUNS = ";
  if (!text.startsWith(prefix) || !text.endsWith(";")) {
    throw new Error("Dashboard data does not use the expected window.AI_HARNESS_RUNS assignment");
  }

  return JSON.parse(text.slice(prefix.length, -1));
}

const data = readDashboardData();

if (!data.summary || typeof data.summary !== "object") {
  fail("summary is missing");
} else {
  if (!Number.isInteger(data.summary.active_count)) {
    fail("summary.active_count must be an integer");
  }
  if (!Number.isInteger(data.summary.archived_count)) {
    fail("summary.archived_count must be an integer");
  }
}

if (!Array.isArray(data.data_quality_warnings)) {
  fail("data_quality_warnings must be an array");
}

if (!data.next_work || typeof data.next_work !== "object") {
  fail("next_work is missing");
} else {
  if (!Array.isArray(data.next_work.github_issues)) {
    fail("next_work.github_issues must be an array");
  }
  if (!Array.isArray(data.next_work.inbox_candidates)) {
    fail("next_work.inbox_candidates must be an array");
  }
  if (!Array.isArray(data.next_work.warnings)) {
    fail("next_work.warnings must be an array");
  }
}

for (const run of data.runs || []) {
  if (!["active", "archived"].includes(run.run_state)) {
    fail(`run_state is missing or invalid for issue #${run.issue_number}`);
  }
}

if (!process.exitCode) {
  console.log("Dashboard data is valid");
}
