import { loadCurrentTask } from "./current-task.ts";
import { isPlainObject } from "./json-value.ts";
import { readTextFile, runPath } from "./repo.ts";
import { readStringField, recordId } from "./task-index.ts";
import type { Violation } from "./violation.ts";

const GATE = "gate:tdd";

type TddEntry = {
  readonly command: string;
  readonly exitCode: number;
  readonly at: number;
  readonly phase: "red" | "green";
};

function readEntry(raw: unknown, position: number): { entry: TddEntry } | { errors: string[] } {
  const label = `entries[${position}]`;
  if (!isPlainObject(raw)) {
    return { errors: [`${label}: 기록은 객체여야 합니다.`] };
  }
  const errors: string[] = [];

  const command = raw["command"];
  if (typeof command !== "string" || command.trim().length === 0) {
    errors.push(`${label}: command는 비어 있지 않은 문자열이어야 합니다.`);
  }
  const exitCode = raw["exit_code"];
  if (typeof exitCode !== "number" || !Number.isInteger(exitCode)) {
    errors.push(`${label}: exit_code는 정수여야 합니다.`);
  }
  const at = raw["at"];
  const timestamp = typeof at === "string" ? Date.parse(at) : Number.NaN;
  if (Number.isNaN(timestamp)) {
    errors.push(`${label}: at은 ISO 8601 시각이어야 합니다.`);
  }
  const phase = raw["phase"];
  if (phase !== "red" && phase !== "green") {
    errors.push(`${label}: phase는 red 또는 green이어야 합니다.`);
  }

  if (errors.length > 0) {
    return { errors };
  }
  const typedPhase = phase === "red" ? "red" : "green";
  const typedExitCode = exitCode as number;
  if (typedPhase === "red" && typedExitCode === 0) {
    errors.push(`${label}: red 기록의 exit_code는 0이 아니어야 합니다.`);
  }
  if (typedPhase === "green" && typedExitCode !== 0) {
    errors.push(`${label}: green 기록의 exit_code는 0이어야 합니다.`);
  }
  if (errors.length > 0) {
    return { errors };
  }

  return {
    entry: {
      command: command as string,
      exitCode: typedExitCode,
      at: timestamp,
      phase: typedPhase,
    },
  };
}

export function checkTddEvidence(evidence: unknown): string[] {
  if (!isPlainObject(evidence) || !Array.isArray(evidence["entries"])) {
    return ["tdd.json은 entries 배열을 가져야 합니다."];
  }
  const rawEntries = evidence["entries"];
  if (rawEntries.length === 0) {
    return ["tdd.json의 entries가 비어 있습니다. RED → GREEN 실행 기록이 필요합니다."];
  }

  const errors: string[] = [];
  const entries: TddEntry[] = [];
  rawEntries.forEach((raw, position) => {
    const parsed = readEntry(raw, position);
    if ("errors" in parsed) {
      errors.push(...parsed.errors);
    } else {
      entries.push(parsed.entry);
    }
  });
  if (errors.length > 0) {
    return errors;
  }

  let provenPairs = 0;
  for (const green of entries.filter((entry) => entry.phase === "green")) {
    const hasEarlierRed = entries.some(
      (entry) => entry.phase === "red" && entry.command === green.command && entry.at < green.at,
    );
    if (hasEarlierRed) {
      provenPairs += 1;
    } else {
      errors.push(`GREEN 기록보다 앞선 같은 명령의 RED 기록이 없습니다: ${green.command}`);
    }
  }
  if (provenPairs === 0 && errors.length === 0) {
    errors.push("RED → GREEN 기록이 하나도 없습니다.");
  }

  return errors;
}

export function runTddGate(root: string): Violation[] {
  const loaded = loadCurrentTask(root, GATE);
  if (!loaded.ok) {
    return [loaded.violation];
  }
  const current = loaded.task;
  if (current === null || readStringField(current.record, "test_mode") !== "tdd") {
    return [];
  }

  const taskId = recordId(current.record);
  const evidencePath = runPath(taskId, "tdd.json");
  const evidenceText = readTextFile(root, evidencePath);
  if (evidenceText === null) {
    return [
      {
        gate: GATE,
        file: evidencePath,
        message: `${taskId}: test_mode가 tdd인데 tdd.json 실행 기록이 없습니다.`,
        hint: "실패(RED) 실행과 통과(GREEN) 실행을 순서대로 tdd.json에 기록하세요.",
      },
    ];
  }

  let evidence: unknown;
  try {
    evidence = JSON.parse(evidenceText);
  } catch (error) {
    return [
      {
        gate: GATE,
        file: evidencePath,
        message: `${taskId}: tdd.json이 유효한 JSON이 아닙니다: ${(error as Error).message}`,
        hint: "tdd.json의 JSON 문법을 고치세요.",
      },
    ];
  }

  return checkTddEvidence(evidence).map((description) => ({
    gate: GATE,
    file: evidencePath,
    message: `${taskId}: ${description}`,
    hint: '형식: {"entries":[{"command":..., "exit_code":..., "at":ISO8601, "phase":"red"|"green"}]}',
  }));
}
