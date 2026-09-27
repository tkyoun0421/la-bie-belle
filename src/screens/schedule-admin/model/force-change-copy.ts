/**
 * 확정 뒤 확인 시트 문안 넷이다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「확정 뒤 문안」 표다.
 *
 * **확정 전과의 갈림이 이 시트다.** 확정 전 배정은 관리자 혼자의 일이고, 확정 뒤 배정은 그
 * 사람의 근무가 생기고 없어지는 사건이라 알림이 나간다 — 무엇이 나가는지를 누르기 전에
 * 시트가 말한다.
 *
 * **알림을 못 받는 사람이면 둘째 줄이 바뀐다**
 * (`docs/2-design/modules/notification/README.md`의 NTF-034). 바꾸기에서 한쪽만 못 받으면
 * 그 사람 이름만 적는다 — 받는 쪽은 안 적는다. 둘 다 못 받는 경우는 표에 없어 「두
 * 사람」으로 묶는다, 한쪽씩 두 줄로 늘리면 시트가 길어지고 표의 어느 행과도 안 맞는다.
 */

export type ForceChangeCopyInput =
  | { kind: "add"; incomingName: string; incomingCanNotify: boolean }
  | { kind: "training"; incomingName: string; incomingCanNotify: boolean }
  | {
      kind: "swap";
      outgoingName: string;
      outgoingCanNotify: boolean;
      incomingName: string;
      incomingCanNotify: boolean;
    }
  | { kind: "remove"; outgoingName: string; outgoingCanNotify: boolean };

export type ForceChangeCopy = {
  title: string;
  notice: string;
  buttons: [string, string];
};

const UNREACHABLE_TAIL = "은 알림을 못 받아요 · 따로 연락해주세요";

function unreachableLine(names: readonly string[]): string {
  if (names.length > 1) {
    return `두 사람${UNREACHABLE_TAIL}`;
  }

  return `${names[0]} 님${UNREACHABLE_TAIL}`;
}

export function forceChangeCopy(input: ForceChangeCopyInput): ForceChangeCopy {
  if (input.kind === "swap") {
    const unreachable = [
      ...(input.outgoingCanNotify ? [] : [input.outgoingName]),
      ...(input.incomingCanNotify ? [] : [input.incomingName]),
    ];

    return {
      title: `${input.outgoingName} 님을 빼고 ${input.incomingName} 님을 넣을까요?`,
      notice:
        unreachable.length === 0
          ? "두 사람에게 알림이 가요"
          : unreachableLine(unreachable),
      buttons: ["닫기", "바꾸기"],
    };
  }

  if (input.kind === "remove") {
    return {
      title: `${input.outgoingName} 님을 뺄까요?`,
      notice: input.outgoingCanNotify
        ? `${input.outgoingName} 님에게 알림이 가요 · 자리는 비어 남아요`
        : unreachableLine([input.outgoingName]),
      buttons: ["닫기", "빼기"],
    };
  }

  return {
    title:
      input.kind === "training"
        ? `${input.incomingName} 님을 교육으로 붙일까요?`
        : `${input.incomingName} 님을 넣을까요?`,
    notice: input.incomingCanNotify
      ? `${input.incomingName} 님에게 알림이 가요`
      : unreachableLine([input.incomingName]),
    buttons: ["닫기", input.kind === "training" ? "붙이기" : "넣기"],
  };
}
