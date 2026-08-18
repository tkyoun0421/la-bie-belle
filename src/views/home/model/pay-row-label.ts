import type { PayRowContent } from "@/views/home/model/home-view-model";

export function toPayRowLabel(row: PayRowContent): string {
  switch (row.kind) {
    case "last-week":
      return row.count === 0 ? "지난주" : `지난주 · ${row.count}회 ${row.hours}시간`;
    case "this-month":
      return row.count === 0
        ? `${row.month}월`
        : `${row.month}월 · ${row.count}회 ${row.hours}시간`;
    case "year-to-date":
      return row.count === 0 ? `${row.year}년 누적` : `${row.year}년 누적 · ${row.count}회`;
  }
}
