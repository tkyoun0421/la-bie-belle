import { canNotifyMember } from "@/screens/scheduleAdmin/model/notifyReach.policy";

const MEMBERS = [
  { id: "p1", notifications_enabled: true, has_device: true },
  { id: "p2", notifications_enabled: false, has_device: true },
  { id: "p3", notifications_enabled: true, has_device: false },
];

describe("canNotifyMember — 의사와 기기가 둘 다 서야 닿는다", () => {
  it("켜 뒀고 기기가 있으면 닿는다", () => {
    expect(canNotifyMember(MEMBERS, "p1")).toBe(true);
  });

  it("알림을 꺼 뒀으면 안 닿는다", () => {
    expect(canNotifyMember(MEMBERS, "p2")).toBe(false);
  });

  it("기기가 없으면 안 닿는다", () => {
    expect(canNotifyMember(MEMBERS, "p3")).toBe(false);
  });
});

describe("canNotifyMember — 목록에 없는 사람", () => {
  it("못 받는 쪽으로 읽는다", () => {
    expect(canNotifyMember(MEMBERS, "모르는사람")).toBe(false);
  });

  it("목록이 비어 있어도 터지지 않는다", () => {
    expect(canNotifyMember([], "p1")).toBe(false);
  });
});
