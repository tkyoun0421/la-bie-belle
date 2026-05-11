#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const priorityLabels = ["priority:p0", "priority:p1", "priority:p2", "priority:p3"];
const apply = process.argv.includes("--apply");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"]
  });
}

function repoFromGitRemote() {
  const remote = run("git", ["config", "--get", "remote.origin.url"]).trim();
  const sshMatch = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  if (!sshMatch) {
    throw new Error(`Cannot parse GitHub owner/repo from remote.origin.url: ${remote}`);
  }
  return `${sshMatch[1]}/${sshMatch[2]}`;
}

function ghJson(path) {
  return JSON.parse(run("gh", ["api", path]));
}

function ghApply(args) {
  run("gh", ["api", ...args], { stdio: "inherit" });
}

function priorityFromBody(body) {
  const match = body?.match(/Priority:\s*(P[0-3])/i);
  return match ? `priority:${match[1].toLowerCase()}` : null;
}

const repo = repoFromGitRemote();
const issues = ghJson(`repos/${repo}/issues?state=open&per_page=100`);
const actions = [];

for (const issue of issues) {
  if (issue.pull_request) continue;

  const desired = priorityFromBody(issue.body);
  const current = issue.labels.map((label) => label.name).filter((name) => priorityLabels.includes(name));

  if (!desired) {
    actions.push({
      issue: issue.number,
      title: issue.title,
      action: "needs-triage",
      reason: "No Priority: P0/P1/P2/P3 marker found in issue body",
      current
    });
    continue;
  }

  for (const label of current.filter((label) => label !== desired)) {
    actions.push({
      issue: issue.number,
      title: issue.title,
      action: "remove",
      label
    });

    if (apply) {
      ghApply(["-X", "DELETE", `repos/${repo}/issues/${issue.number}/labels/${encodeURIComponent(label)}`]);
    }
  }

  if (!current.includes(desired)) {
    actions.push({
      issue: issue.number,
      title: issue.title,
      action: "add",
      label: desired
    });

    if (apply) {
      ghApply(["-X", "POST", `repos/${repo}/issues/${issue.number}/labels`, "-f", `labels[]=${desired}`]);
    }
  }
}

console.log(JSON.stringify({ apply, repo, actions }, null, 2));
