import { format } from "date-fns";

const REVISED_AT_FORMAT = "M월 d일 HH:mm";

export function shouldShowRevisionNotice(revision: number): boolean {
  return revision > 1;
}

export function formatRevisedAt(revisedAt: string): string {
  return format(new Date(revisedAt), REVISED_AT_FORMAT);
}
