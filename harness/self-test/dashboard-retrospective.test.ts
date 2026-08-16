import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectCoaching,
  collectRetrospective,
  parseCases,
  parseCoachingSuggestions,
  parseProposals,
  renderCoachingPage,
  renderRetrospectivePage,
} from "../dashboard/retrospective.ts";
import { createFixtureRoot, writeFixtureFile } from "./fixture.ts";

const CASES_PATH = "docs/execution/retrospective/cases.md";
const PROPOSALS_PATH = "docs/execution/retrospective/proposals.md";

test("회고 페이지 — cases.md 한 줄을 필드로 가른다", () => {
  const parsed = parseCases(
    "- P0-T46 | 성공 | 게이트를 먼저 세웠다 | docs/execution/runs/P0-T46/\n",
  );

  assert.equal(parsed.cases.length, 1);
  assert.equal(parsed.cases[0]?.taskId, "P0-T46");
  assert.equal(parsed.cases[0]?.outcome, "성공");
  assert.equal(parsed.cases[0]?.summary, "게이트를 먼저 세웠다");
  assert.deepEqual(parsed.malformed, []);
});

test("회고 페이지 — 필드가 모자란 줄을 형식 오류로 모은다", () => {
  const parsed = parseCases("- P0-T46 | 성공\n");

  assert.deepEqual(parsed.cases, []);
  assert.equal(parsed.malformed.length, 1);
});

test("회고 페이지 — 성공·실패 집계를 렌더한다", () => {
  const root = createFixtureRoot();
  writeFixtureFile(
    root,
    CASES_PATH,
    "- P0-T44 | 성공 | 요약 | 경로\n- P0-T45 | 실패 | 요약 | 경로\n- P0-T46 | 성공 | 요약 | 경로\n",
  );
  writeFixtureFile(root, PROPOSALS_PATH, "- [ ] 제안 하나 | 출처 P0-T46 | 경로\n");

  const html = renderRetrospectivePage(collectRetrospective(root));

  assert.match(html, /성공 <span class="mono">2<\/span>/u);
  assert.match(html, /실패 <span class="mono">1<\/span>/u);
  assert.match(html, /제안 하나/u);
});

test("회고 페이지 — 해결된 제안은 미결 목록에서 뺀다", () => {
  const proposals = parseProposals("- [x] 끝난 제안 | 출처 P0-T40\n- [ ] 남은 제안 | 출처 P0-T41\n");

  assert.equal(proposals.length, 2);
  assert.equal(proposals.filter((proposal) => !proposal.done).length, 1);
});

test("회고 페이지 — 원본이 없으면 누락을 표시하고 생성은 계속한다", () => {
  const root = createFixtureRoot();

  const html = renderRetrospectivePage(collectRetrospective(root));

  assert.match(html, /cases\.md 누락/u);
  assert.match(html, /proposals\.md 누락/u);
});

test("코칭 페이지 — 중요도 순으로 제안을 정렬한다", () => {
  const suggestions = parseCoachingSuggestions(
    "## low\n- 낮은 것\n## critical\n- 급한 것\n## medium\n- 중간 것\n",
  );

  assert.deepEqual(
    suggestions.map((suggestion) => suggestion.severity),
    ["critical", "medium", "low"],
  );
});

test("코칭 페이지 — 최신 결과와 실행 이력을 렌더한다", () => {
  const root = createFixtureRoot();
  writeFixtureFile(root, "docs/execution/coaching/2026-08-10-coach.md", "## high\n- 예전 제안\n");
  writeFixtureFile(root, "docs/execution/coaching/2026-08-16-coach.md", "## critical\n- 최신 제안\n");

  const view = collectCoaching(root);
  const html = renderCoachingPage(view);

  assert.equal(view.latest?.label, "2026-08-16-coach");
  assert.equal(view.history.length, 2);
  assert.match(html, /최신 제안/u);
  assert.doesNotMatch(html, /예전 제안/u);
  assert.match(html, /2026-08-10-coach/u);
});

test("코칭 페이지 — 실행 이력이 없으면 누락을 표시한다", () => {
  const root = createFixtureRoot();

  const html = renderCoachingPage(collectCoaching(root));

  assert.match(html, /코칭 결과 누락/u);
  assert.match(html, /실행 이력 없음/u);
});
