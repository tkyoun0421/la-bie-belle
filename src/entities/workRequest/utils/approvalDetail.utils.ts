import {
  clockOf,
  formatBareDate,
  kstClockOf,
  kstDateOf,
  spellDate,
} from "@/shared/utils/kstDate";

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

export function cancelApprovalRowTitle(row: {
  displayName: string;
  workDate: string;
  position: string;
}): string {
  return `${row.displayName} · ${formatBareDate(row.workDate)} ${row.position}`;
}

export function cancelApprovalConfirmBody(row: {
  displayName: string;
  workDate: string;
  position: string;
}): string {
  return `${formatBareDate(row.workDate)} ${row.position} 자리가 비고 ${row.displayName}님에게 알림이 가요`;
}

export function cancelApprovalDetail(
  input: CancelApprovalInput,
): CancelApprovalDetail {
  const sent = new Date(input.sentAt);

  return {
    title: `${input.displayName} · ${spellDate(input.workDate)} ${input.position}`,
    subtitle: `${clockOf(input.startsAt)}–${clockOf(input.endsAt)}`,
    sentAtLine: `${formatBareDate(kstDateOf(sent))} ${kstClockOf(sent)}에 보냈어요`,
    reason: input.reason,
  };
}
