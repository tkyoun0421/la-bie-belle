import { readFileSync } from "node:fs";
import {
  checkImpactSection,
  findImpacted,
} from "../tests/lint/sourcesImpact.ts";
import { sourceDocs } from "../tests/lint/specDocs.ts";

function changedFiles(): string[] {
  let input: string;

  try {
    input = readFileSync(0, "utf8");
  } catch {
    input = "";
  }

  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

const impacted = findImpacted(changedFiles(), sourceDocs());

if (impacted.length === 0) {
  console.log("추적 중인 spec·plan의 입력이 바뀌지 않았다.");
  process.exit(0);
}

console.log(`영향받는 문서: ${impacted.join(", ")}`);

const violations = checkImpactSection(process.env.PR_BODY ?? "", impacted);

for (const violation of violations) {
  console.log(
    violation.kind === "missing-section"
      ? `${violation.document}: PR 본문에 「영향 확인」 절이 없다`
      : `${violation.document}: 「영향 확인」 절이 이 문서를 안 든다`,
  );
}

if (violations.length > 0) {
  process.exit(1);
}

console.log("PR 본문의 「영향 확인」 절이 영향받는 문서를 전부 든다.");
