import { runCommitMsgGate } from "../lib/commit-msg-gate.ts";
import { reportViolations } from "../lib/violation.ts";

const messageFilePath = process.argv[2];

process.exitCode =
  messageFilePath === undefined
    ? reportViolations([
        {
          gate: "commit-msg",
          message: "커밋 메시지 파일 경로 인자가 없습니다.",
          hint: "commit-msg 훅이 전달하는 $1 경로를 인자로 넘기세요.",
        },
      ])
    : reportViolations(runCommitMsgGate(messageFilePath));
