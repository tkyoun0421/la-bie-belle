import { kstClockOf, kstDateOf, spellDate } from "@/shared/utils/kstDate";

export type CancelApprovalInput = {
  displayName: string;
  workDate: string;
  position: string;
  startsAt: string;
  endsAt: string;
  sentAt: string;
  reason: string;
};

export type CancelApprovalDetail = {
  title: string;
  subtitle: string;
  sentAtLine: string;
  reason: string;
};

function bareDate(workDate: string): string {
  const [, month, day] = workDate.split("-").map(Number);

  return `${month}월 ${day}일`;
}

export function cancelApprovalRowTitle(row: {
  displayName: string;
  workDate: string;
  position: string;
}): string {
  return `${row.displayName} · ${bareDate(row.workDate)} ${row.position}`;
}

export function cancelApprovalConfirmBody(row: {
  displayName: string;
  workDate: string;
  position: string;
}): string {
  return `${bareDate(row.workDate)} ${row.position} 자리가 비고 ${row.displayName}님에게 알림이 가요`;
}

export function cancelApprovalDetail(
  input: CancelApprovalInput,
): CancelApprovalDetail {
  const sent = new Date(input.sentAt);

  return {
    title: `${input.displayName} · ${spellDate(input.workDate)} ${input.position}`,
    subtitle: `${input.startsAt.slice(0, 5)}–${input.endsAt.slice(0, 5)}`,
    sentAtLine: `${bareDate(kstDateOf(sent))} ${kstClockOf(sent)}에 보냈어요`,
    reason: input.reason,
  };
}
