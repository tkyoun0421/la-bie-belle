export function blockedCommitPolicy(taskId, stagedPaths) {
  const allowed = new Set([
    "docs/phases/index.jsonl",
    `.agents/runs/${taskId}/attempts.json`,
    `.agents/runs/${taskId}/manual-summary.md`
  ]);
  const missing = [...allowed].filter((path) => !stagedPaths.includes(path));
  const unexpected = stagedPaths.filter((path) => !allowed.has(path));
  if (missing.length) return `${taskId}: blocked commit is missing ${missing.join(", ")}`;
  if (unexpected.length) return `${taskId}: blocked commit cannot include ${unexpected.join(", ")}`;
  return null;
}
