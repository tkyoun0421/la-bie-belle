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
