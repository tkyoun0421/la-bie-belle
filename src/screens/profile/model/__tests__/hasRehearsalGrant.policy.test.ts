// 구현 대상: src/screens/profile/model/hasRehearsalGrant.ts
//
// 「나」의 리허설 줄과 /me/rehearsals 가드가 같이 쓰는 판정이다(profile.md 「리허설」,
// design.md 「자격」) — useQualificationsQuery(client)가 낸 행 중에 내 profile_id와 position이
// '리허설'인 행이 있는지를 본다. 새 DAL 없이 기존 qualifications 뷰 결과를 그대로 거른다.

import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant";

const MY_ID = "profile-1";

describe("hasRehearsalGrant — 내 행 중에 position이 '리허설'이면 참이다", () => {
  it("내 리허설 자격 행이 있으면 참이다", () => {
    const rows = [
      { profile_id: MY_ID, position: "리허설" },
      { profile_id: "profile-2", position: "스캔" },
    ];

    expect(hasRehearsalGrant(rows, MY_ID)).toBe(true);
  });
});

describe("hasRehearsalGrant — 리허설이 아닌 자격은 안 센다", () => {
  it("내 행이 있어도 position이 리허설이 아니면 거짓이다", () => {
    const rows = [{ profile_id: MY_ID, position: "스캔" }];

    expect(hasRehearsalGrant(rows, MY_ID)).toBe(false);
  });
});

describe("hasRehearsalGrant — 남의 리허설 자격은 안 센다", () => {
  it("리허설 행이 있어도 내 profile_id가 아니면 거짓이다", () => {
    const rows = [{ profile_id: "profile-2", position: "리허설" }];

    expect(hasRehearsalGrant(rows, MY_ID)).toBe(false);
  });
});

describe("hasRehearsalGrant — 행이 없으면 거짓이다", () => {
  it("빈 배열이면 거짓이다", () => {
    expect(hasRehearsalGrant([], MY_ID)).toBe(false);
  });
});
