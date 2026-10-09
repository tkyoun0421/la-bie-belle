import type { MemberSummary } from "@/entities/member/model/member.type";

type NamedRow = Pick<MemberSummary, "displayName">;

export type SearchedMembers<Row> = {
  active: Row[];
  left: Row[];
  isEmpty: boolean;
};

function matches(row: NamedRow, needle: string): boolean {
  return (row.displayName ?? "").includes(needle);
}

export function searchMembers<Row extends NamedRow>(
  active: readonly Row[],
  left: readonly Row[],
  query: string,
): SearchedMembers<Row> {
  const needle = query.trim();

  const found =
    needle === ""
      ? { active: [...active], left: [...left] }
      : {
          active: active.filter((row) => matches(row, needle)),
          left: left.filter((row) => matches(row, needle)),
        };

  return {
    ...found,
    isEmpty: found.active.length === 0 && found.left.length === 0,
  };
}
