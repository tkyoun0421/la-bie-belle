import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant.policy";

const MY_ID = "profile-1";

describe("hasRehearsalGrant — 내 행 중에 position이 '리허설'이면 참이다", () => {
  it("내 리허설 자격 행이 있으면 참이다", () => {
    const rows = [
      { profileId: MY_ID, position: "리허설" },
      { profileId: "profile-2", position: "스캔" },
    ];

    expect(hasRehearsalGrant(rows, MY_ID)).toBe(true);
  });
});

describe("hasRehearsalGrant — 리허설이 아닌 자격은 안 센다", () => {
  it("내 행이 있어도 position이 리허설이 아니면 거짓이다", () => {
    const rows = [{ profileId: MY_ID, position: "스캔" }];

    expect(hasRehearsalGrant(rows, MY_ID)).toBe(false);
  });
});

describe("hasRehearsalGrant — 남의 리허설 자격은 안 센다", () => {
  it("리허설 행이 있어도 내 profileId가 아니면 거짓이다", () => {
    const rows = [{ profileId: "profile-2", position: "리허설" }];

    expect(hasRehearsalGrant(rows, MY_ID)).toBe(false);
  });
});

describe("hasRehearsalGrant — 행이 없으면 거짓이다", () => {
  it("빈 배열이면 거짓이다", () => {
    expect(hasRehearsalGrant([], MY_ID)).toBe(false);
  });
});
