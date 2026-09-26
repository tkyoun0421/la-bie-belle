import {
  armProfileReadFailure,
  isDevDoorOpen,
  takeProfileReadFailure,
} from "@/shared/lib/dev-door";

describe("isDevDoorOpen — 테스트 문은 개발 빌드에만 선다", () => {
  it("개발 빌드에서는 열린다", () => {
    expect(isDevDoorOpen(true)).toBe(true);
  });

  it("프로덕션 빌드에서는 닫힌다", () => {
    expect(isDevDoorOpen(false)).toBe(false);
  });
});

describe("프로필 읽기 실패 표시 — 켜두면 다음 한 번만 쓰인다", () => {
  it("안 켜두면 꺼져 있다", () => {
    expect(takeProfileReadFailure()).toBe(false);
  });

  it("켜두면 한 번은 켜진 채로 나온다", () => {
    armProfileReadFailure();

    expect(takeProfileReadFailure()).toBe(true);
  });

  it("한 번 쓰이면 그다음부터는 꺼져 있다", () => {
    armProfileReadFailure();
    takeProfileReadFailure();

    expect(takeProfileReadFailure()).toBe(false);
  });
});
