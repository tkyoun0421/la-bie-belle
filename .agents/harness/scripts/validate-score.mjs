#!/usr/bin/env node

import { readFileSync } from "node:fs";

const file = process.argv[2];

if (!file) {
  console.error("사용법: node .agents/harness/scripts/validate-score.mjs <review-score.json>");
  process.exit(1);
}

const score = JSON.parse(readFileSync(file, "utf8"));
const errors = [];

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

if (!score.score_id) errors.push("score_id가 없습니다.");
if (!score.rubric || !score.rubric.name || !Number.isInteger(score.rubric.version)) {
  errors.push("rubric.name 또는 rubric.version이 올바르지 않습니다.");
}
if (!isNumber(score.total_score) || score.total_score < 0 || score.total_score > 100) {
  errors.push("total_score는 0-100 사이 숫자여야 합니다.");
}
if (!["PASS", "REWORK", "FAIL", "INFO"].includes(score.decision)) {
  errors.push("decision은 PASS, REWORK, FAIL, INFO 중 하나여야 합니다.");
}
if (!Array.isArray(score.categories) || score.categories.length === 0) {
  errors.push("categories가 비어 있습니다.");
}

let categoryTotal = 0;
let categoryMaxTotal = 0;

for (const category of score.categories || []) {
  if (!category.id) errors.push("category.id가 없습니다.");
  if (!isNumber(category.score)) errors.push(`${category.id || "unknown"} score가 숫자가 아닙니다.`);
  if (!isNumber(category.max_score)) errors.push(`${category.id || "unknown"} max_score가 숫자가 아닙니다.`);
  if (isNumber(category.score) && isNumber(category.max_score)) {
    if (category.score < 0) errors.push(`${category.id} score가 0보다 작습니다.`);
    if (category.score > category.max_score) errors.push(`${category.id} score가 max_score보다 큽니다.`);
    categoryTotal += category.score;
    categoryMaxTotal += category.max_score;
  }
  if (!Array.isArray(category.evidence)) errors.push(`${category.id} evidence는 배열이어야 합니다.`);
  if (!Array.isArray(category.deductions)) errors.push(`${category.id} deductions는 배열이어야 합니다.`);
}

if (Math.abs(categoryTotal - score.total_score) > 0.001) {
  errors.push(`categories 합계(${categoryTotal})와 total_score(${score.total_score})가 다릅니다.`);
}
if (categoryMaxTotal !== 100) {
  errors.push(`categories max_score 합계가 100이 아닙니다: ${categoryMaxTotal}`);
}

if (score.decision !== "INFO") {
  const expectedDecision = score.total_score >= 80 ? "PASS" : score.total_score >= 65 ? "REWORK" : "FAIL";
  if (score.decision !== expectedDecision) {
    errors.push(`total_score 기준 decision은 ${expectedDecision}이어야 합니다.`);
  }
}

if (errors.length > 0) {
  console.error("점수 기록 검증 실패:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`점수 기록 검증 통과: ${file}`);
