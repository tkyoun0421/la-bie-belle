import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = ".agents/harness/scripts/validate-score.mjs";
const templatePath = ".agents/harness/templates/review-score.json";
const legacyScorePath = ".agents/runs/issue-47/review-score.json";

type ScoreRecord = {
  categories: Array<{
    score: number;
    deductions: Array<string | Record<string, unknown>>;
    subcriteria?: Array<{
      quality_levels?: Record<string, string>;
    }>;
  }>;
};

function runValidator(filePath: string) {
  return execFileSync(process.execPath, [scriptPath, filePath], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}

function withTempScore(mutator: (score: ScoreRecord) => void) {
  const dir = mkdtempSync(join(tmpdir(), "harness-score-"));
  const file = join(dir, "review-score.json");
  const score = JSON.parse(readFileSync(templatePath, "utf8").replace(/^\uFEFF/, "")) as ScoreRecord;
  mutator(score);
  writeFileSync(file, `${JSON.stringify(score, null, 2)}\n`);
  return { dir, file };
}

describe("validate-score", () => {
  it("accepts legacy review scores without subcriteria", () => {
    expect(runValidator(legacyScorePath)).toContain("점수 기록 검증 통과");
  });

  it("accepts the detailed subcriteria template", () => {
    expect(runValidator(templatePath)).toContain("점수 기록 검증 통과");
  });

  it("rejects subcriteria score totals that differ from the parent category", () => {
    const { dir, file } = withTempScore((score) => {
      score.categories[0].score = 1;
    });

    try {
      expect(() => runValidator(file)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects object deductions without a reason", () => {
    const { dir, file } = withTempScore((score) => {
      score.categories[0].deductions.push({ points: 1, follow_up: "감점 사유를 보강한다." });
    });

    try {
      expect(() => runValidator(file)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects subcriteria without quality levels", () => {
    const { dir, file } = withTempScore((score) => {
      delete score.categories[0].subcriteria?.[0]?.quality_levels;
    });

    try {
      expect(() => runValidator(file)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
