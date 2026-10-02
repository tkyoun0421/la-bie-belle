import { spellDate } from "@/shared/utils/kstDate";

/**
 * 값이 들어가야 서는 문구들이다
 * (`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 문안 표).
 *
 * **고정 문안과 갈라 둔다.** 글자가 안 바뀌는 것은
 * [`scheduleWorker.const.ts`](../consts/scheduleWorker.const.ts)가 들고 여기는 달과 요청과
 * 근무를 받아 조립하는 손만 든다 — 조립을 `consts/`에 넣으면 그 파일이 실행 코드를 들고,
 * 글자를 여기 넣으면 문안을 고칠 때 두 자리를 봐야 한다.
 *
 * **요청의 생 꼴을 통째로 안 받는다.** 쓰는 칸이 포지션 첫 줄과 날과 시각뿐이라 받는 모양을
 * 그만큼으로 좁혔다 — `agendaRow.utils.ts`가 배정을 받는 꼴과 같은 축이다.
 */

export type RequestLine = {
  slots: {
    positions: readonly string[];
    days: { work_date: string; starts_at: string; ends_at: string };
  };
};

/** 「10:00:00」에서 초를 뗀다. */
function clockLabel(clock: string): string {
  return clock.slice(0, 5);
}

/** 「2026-10」에서 「10」을 뽑는다 — 한 자리 달은 앞의 0을 뗀다. */
function monthLabel(month: string): number {
  return Number(month.slice(5));
}

export function spellSubmitted(month: string): string {
  return `${monthLabel(month)}월 근무 신청을 보냈어요`;
}

export function spellNotOpen(month: string): string {
  return `아직 ${monthLabel(month)}월 근무 신청을 받지 않아요. 열리면 알려드릴게요`;
}

/** 요청 시트 부제 — 「10월 17일(토) · 안내 · 10:00 – 18:00」. */
export function requestSubtitle({ slots }: RequestLine): string {
  const { positions, days } = slots;

  return `${spellDate(days.work_date)} · ${positions[0] ?? ""} · ${clockLabel(days.starts_at)} – ${clockLabel(days.ends_at)}`;
}

/**
 * 늦은 수락이 달력 아래 줄에 남기는 사건 문구다.
 *
 * **여기만 요일을 안 붙인다.** 지나간 일을 적는 줄이라 그 날을 다시 찾아갈 일이 없고,
 * 요일까지 붙이면 바로 위 달력의 날짜 칸과 글자가 겹친다.
 */
export function claimedLine({ slots }: RequestLine): string {
  const [, month, day] = slots.days.work_date.split("-").map(Number);

  return `${month}월 ${day}일 ${slots.positions[0] ?? ""} 자리는 다른 분이 맡았어요`;
}

export function cancelSheetTitle(workDate: string, position: string): string {
  return `근무 취소 · ${spellDate(workDate)} ${position}`;
}
