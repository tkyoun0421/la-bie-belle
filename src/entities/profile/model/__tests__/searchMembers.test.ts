import { searchMembers } from "@/entities/profile/model/searchMembers";

// 직원 화면의 검색이다(`docs/2-design/modules/account/screens/members.md`의 「검색」).
// 재직자와 퇴사 구획을 같은 글자로 동시에 거르고, 퇴사 구획은 1년이 지나 접힌 줄도 이름이
// 맞으면 걸러 낸다. 둘 다 비면 화면이 빈 상태를 그린다 — 그 판정을 `isEmpty`로 낸다.

const ACTIVE = [
  { id: "1", display_name: "김민준" },
  { id: "2", display_name: "박서연" },
];

const LEFT = [
  { id: "3", display_name: "이도윤" },
  { id: "4", display_name: "김하늘" },
];

describe("searchMembers — 두 구획을 같은 글자로 동시에 거른다", () => {
  it("검색어가 비어 있으면 두 목록을 그대로 낸다", () => {
    const result = searchMembers(ACTIVE, LEFT, "");

    expect(result.active).toEqual(ACTIVE);
    expect(result.left).toEqual(LEFT);
    expect(result.isEmpty).toBe(false);
  });

  it("이름에 검색어가 든 재직자만 남긴다", () => {
    const result = searchMembers(ACTIVE, LEFT, "박서");

    expect(result.active.map((row) => row.id)).toEqual(["2"]);
  });

  it("이름에 검색어가 든 퇴사자만 남긴다 — 접힌 줄도 걸러 낸다", () => {
    const result = searchMembers(ACTIVE, LEFT, "김하늘");

    expect(result.left.map((row) => row.id)).toEqual(["4"]);
  });

  it("맞는 이름이 재직자에도 퇴사자에도 없으면 isEmpty가 참이다", () => {
    const result = searchMembers(ACTIVE, LEFT, "존재하지않는이름");

    expect(result.active).toEqual([]);
    expect(result.left).toEqual([]);
    expect(result.isEmpty).toBe(true);
  });

  it("한쪽만 맞으면 isEmpty가 거짓이다", () => {
    const result = searchMembers(ACTIVE, LEFT, "박서연");

    expect(result.left).toEqual([]);
    expect(result.isEmpty).toBe(false);
  });
});
