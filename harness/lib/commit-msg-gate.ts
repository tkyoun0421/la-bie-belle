import { readFileSync } from "node:fs";
import type { Violation } from "./violation.ts";

const GATE = "commit-msg";

export const TASK_ID_PATTERN = /P[0-9]+-T[0-9]{2}/u;

function stripComments(message: string): string {
  return message
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .join("\n");
}

export function checkCommitMessage(message: string): string[] {
  const body = stripComments(message).trim();
  if (body.length === 0) {
    return ["커밋 메시지가 비어 있습니다."];
  }
  if (!TASK_ID_PATTERN.test(body)) {
    return ["커밋 메시지에 task ID가 없습니다. P[0-9]+-T[0-9]{2} 형식이 필요합니다."];
  }
  return [];
}

export function runCommitMsgGate(messageFilePath: string): Violation[] {
  let message: string;
  try {
    message = readFileSync(messageFilePath, "utf8");
  } catch {
    return [
      {
        gate: GATE,
        file: messageFilePath,
        message: "커밋 메시지 파일을 읽을 수 없습니다.",
        hint: "commit-msg 훅이 전달한 메시지 파일 경로를 확인하세요.",
      },
    ];
  }

  return checkCommitMessage(message).map((description) => ({
    gate: GATE,
    file: messageFilePath,
    message: description,
    hint: "예: feat(P0-T31): 경량 게이트형 하네스 구현",
  }));
}
