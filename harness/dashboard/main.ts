import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { repoPath, resolveRepoRoot } from "../lib/repo.ts";
import type { Collection } from "./collect.ts";
import { collect } from "./collect.ts";
import { recommendNextAction } from "./next-action.ts";
import { summarizeProgress } from "./progress.ts";
import type { DashboardView } from "./render.ts";
import { DASHBOARD_PATH, renderDashboard } from "./render.ts";
import { summarizeReviews } from "./reviews.ts";
import { computeReadiness } from "./rubric.ts";

function debtDetail(collection: Collection): string[] {
  return collection.openDebts.map((debt) => `${debt.source} ${debt.items.length}건`);
}

function adrDetail(collection: Collection): string[] {
  return collection.pendingAdrs.map((adr) => `${adr.file} (${adr.state})`);
}

export function buildView(collection: Collection): DashboardView {
  const progress = summarizeProgress(collection.records);
  const openDebtCount = collection.openDebts.reduce((total, debt) => total + debt.items.length, 0);

  return {
    generatedAt: collection.generatedAt,
    baseCommit: collection.git.headCommit,
    baseCommitSubject: collection.git.headSubject,
    workingTreeNote: collection.git.workingTreeNote,
    readiness: computeReadiness({
      gates: collection.gates,
      referenceGates: collection.referenceGates,
      evidence: collection.evidence,
      runnablePlannedCount: progress.runnable.length,
      blockedCount: progress.blocked.length,
      freshness: collection.freshness,
      pendingAdrCount: collection.pendingAdrs.length,
      pendingAdrDetail: adrDetail(collection),
      openDebtCount,
      openDebtDetail: debtDetail(collection),
    }),
    progress,
    nextAction: recommendNextAction(progress),
    reviews: summarizeReviews(collection.reviewDocuments, collection.backlogMarkdown),
    notices: collection.notices,
  };
}

function generate(root: string, now: Date): string {
  const html = renderDashboard(buildView(collect(root, now)));
  const absolutePath = repoPath(root, DASHBOARD_PATH);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, html, "utf8");
  return DASHBOARD_PATH;
}

try {
  process.stdout.write(`${generate(resolveRepoRoot(), new Date())}\n`);
} catch (error) {
  process.stderr.write(`대시보드 생성에 실패했습니다: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
