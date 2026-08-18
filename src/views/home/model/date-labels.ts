import { format } from "date-fns";
import { ko } from "date-fns/locale";

function toDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

export function toFullDateLabel(dateKey: string): string {
  return format(toDate(dateKey), "M월 d일 EEEE", { locale: ko });
}

export function toShortDateLabel(dateKey: string): string {
  return format(toDate(dateKey), "M월 d일 EEE", { locale: ko });
}
