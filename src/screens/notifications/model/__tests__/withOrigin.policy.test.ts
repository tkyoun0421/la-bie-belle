import { ORIGIN_NOTIFICATIONS } from "@/shared/consts/navigation.const";
import { BACK_BEARING_PREFIXES } from "@/screens/notifications/consts/notifications.const";

const { withOrigin } = await import(
  // @ts-expect-error withOrigin이 아직 이 자리에 없다
  "@/screens/notifications/model/withOrigin.policy"
);

const ORIGIN = `from=${ORIGIN_NOTIFICATIONS}`;

describe("withOrigin — 돌아갈 자리를 달아야 하나", () => {
  it("돌아가기를 지지 않는 곳은 그대로 둔다", () => {
    expect(withOrigin("/settings")).toBe("/settings");
  });

  it("돌아가기를 지는 곳에 출처를 단다", () => {
    const destination = BACK_BEARING_PREFIXES[0];

    expect(withOrigin(destination)).toBe(`${destination}?${ORIGIN}`);
  });

  it("물음표가 이미 있으면 앰퍼샌드로 잇는다", () => {
    const destination = `${BACK_BEARING_PREFIXES[0]}?date=2026-10-21`;

    expect(withOrigin(destination)).toBe(`${destination}&${ORIGIN}`);
  });
});
