#!/usr/bin/env node

import { readFileSync } from "node:fs";

const file = process.argv[2];

if (!file) {
  console.error("사용법: node .agents/harness/scripts/validate-score.mjs <review-score.json>");
  process.exit(1);
}

const score = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const errors = [];

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function pushNumberErrors(item, path) {
  if (!item.id) errors.push(`${path}.id가 없습니다.`);
  if (!isNumber(item.score)) errors.push(`${path}.score가 숫자가 아닙니다.`);
  if (!isNumber(item.max_score)) errors.push(`${path}.max_score가 숫자가 아닙니다.`);

  if (isNumber(item.score) && isNumber(item.max_score)) {
    if (item.score < 0) errors.push(`${path}.score가 0보다 작습니다.`);
    if (item.max_score <= 0) errors.push(`${path}.max_score는 0보다 커야 합니다.`);
    if (item.score > item.max_score) errors.push(`${path}.score가 max_score보다 큽니다.`);
  }
}

function validateDeductions(deductions, path) {
  if (!Array.isArray(deductions)) {
    errors.push(`${path}.deductions는 배열이어야 합니다.`);
    return;
  }

  deductions.forEach((deduction, index) => {
    const deductionPath = `${path}.deductions[${index}]`;
    if (typeof deduction === "string") return;

    if (!deduction || typeof deduction !== "object" || Array.isArray(deduction)) {
      errors.push(`${deductionPath}는 문자열 또는 객체여야 합니다.`);
      return;
    }

    if (typeof deduction.reason !== "string" || deduction.reason.trim() === "") {
      errors.push(`${deductionPath}.reason이 필요합니다.`);
    }
    if ("points" in deduction && (!isNumber(deduction.points) || deduction.points <= 0)) {
      errors.push(`${deductionPath}.points는 0보다 큰 숫자여야 합니다.`);
    }
    if ("follow_up" in deduction && typeof deduction.follow_up !== "string") {
      errors.push(`${deductionPath}.follow_up은 문자열이어야 합니다.`);
    }
    if ("severity" in deduction && !["low", "medium", "high"].includes(deduction.severity)) {
      errors.push(`${deductionPath}.severity는 low, medium, high 중 하나여야 합니다.`);
    }
  });
}

function validateScoredItem(item, path, qualityLevelsRequired = false) {
  pushNumberErrors(item, path);

  if (!Array.isArray(item.evidence)) errors.push(`${path}.evidence는 배열이어야 합니다.`);
  validateDeductions(item.deductions, path);
  validateQualityLevels(item.quality_levels, path, qualityLevelsRequired);

  if (!("subcriteria" in item)) return;

  if (!Array.isArray(item.subcriteria)) {
    errors.push(`${path}.subcriteria는 배열이어야 합니다.`);
    return;
  }
  if (item.subcriteria.length === 0) {
    errors.push(`${path}.subcriteria는 비어 있을 수 없습니다.`);
    return;
  }

  let subScoreTotal = 0;
  let subMaxTotal = 0;

  item.subcriteria.forEach((subcriterion, index) => {
    const subPath = `${path}.subcriteria[${index}]`;
    validateScoredItem(subcriterion, subPath, true);
    if (isNumber(subcriterion.score)) subScoreTotal += subcriterion.score;
    if (isNumber(subcriterion.max_score)) subMaxTotal += subcriterion.max_score;
  });

  if (isNumber(item.score) && Math.abs(subScoreTotal - item.score) > 0.001) {
    errors.push(`${path}.subcriteria score 합계(${subScoreTotal})가 category score(${item.score})와 다릅니다.`);
  }
  if (isNumber(item.max_score) && Math.abs(subMaxTotal - item.max_score) > 0.001) {
    errors.push(`${path}.subcriteria max_score 합계(${subMaxTotal})가 category max_score(${item.max_score})와 다릅니다.`);
  }
}

function validateQualityLevels(qualityLevels, path, required) {
  if (qualityLevels === undefined) {
    if (required) errors.push(`${path}.quality_levels가 필요합니다.`);
    return;
  }
  if (!qualityLevels || typeof qualityLevels !== "object" || Array.isArray(qualityLevels)) {
    errors.push(`${path}.quality_levels는 객체여야 합니다.`);
    return;
  }

  for (const key of ["full", "partial", "minimal", "zero"]) {
    if (typeof qualityLevels[key] !== "string" || qualityLevels[key].trim() === "") {
      errors.push(`${path}.quality_levels.${key}가 필요합니다.`);
    }
  }
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

for (const [index, category] of (score.categories || []).entries()) {
  const path = `categories[${index}]`;
  validateScoredItem(category, path);
  if (isNumber(category.score)) categoryTotal += category.score;
  if (isNumber(category.max_score)) categoryMaxTotal += category.max_score;
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
