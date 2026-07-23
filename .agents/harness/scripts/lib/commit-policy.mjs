export function blockedCommitPolicy(taskId, stagedPaths) {
  const allowed = new Set([
    "docs/phases/index.jsonl",
    `.agents/runs/${taskId}/attempts.json`,
    `.agents/runs/${taskId}/manual-summary.md`
  ]);
  const missing = [...allowed].filter((path) => !stagedPaths.includes(path));
  const unexpected = stagedPaths.filter((path) => !allowed.has(path));
  if (missing.length) return `${taskId}: blocked 커밋에 필수 파일이 없습니다: ${missing.join(", ")}`;
  if (unexpected.length) return `${taskId}: blocked 커밋에는 다음 파일을 포함할 수 없습니다: ${unexpected.join(", ")}`;
  return null;
}
