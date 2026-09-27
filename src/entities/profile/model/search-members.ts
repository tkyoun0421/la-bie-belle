/**
 * 직원 화면의 검색이다. 근거는 `docs/2-design/modules/account/screens/members.md`의 「검색」이다.
 *
 * **두 구획을 같은 글자로 동시에 거른다.** 찾는 사람이 재직 중인지 그만뒀는지를 미리 알아야
 * 검색어를 넣을 수 있다면 그것은 검색이 아니다. 퇴사 구획에서 1년이 지나 접힌 줄도 걸러
 * 낸다 — 이름이 맞으면 「더 보기」 없이 그 줄이 바로 선다.
 *
 * `isEmpty`는 「거르고 나니 둘 다 비었다」는 판정이다. 아직 승인된 사람이 아무도 없는 것과는
 * 다른 자리라 화면이 다른 말을 한다.
 */

type NamedRow = { display_name: string | null };

export type SearchedMembers<Row> = {
  active: Row[];
  left: Row[];
  isEmpty: boolean;
};

function matches(row: NamedRow, needle: string): boolean {
  return (row.display_name ?? "").includes(needle);
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
