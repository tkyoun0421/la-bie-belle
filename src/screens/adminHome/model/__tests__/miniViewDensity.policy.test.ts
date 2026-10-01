// 구현 대상: src/screens/adminHome/model/miniViewDensity.ts
//
// 이번 달 근무표 미니뷰의 칸 진하기다(admin-home.md 「이번 달 근무표 미니뷰」) — 배정
// 인원이 많을수록 `bg.brand-weak`에서 `bg.brand-solid`로 진해지고, 안 연 날은 빈칸이다.
// 문서가 정확한 단계 수를 안 못 박아서, 이 테스트는 0(가장 옅음)~1(가장 진함) 정규화
// 값을 계약으로 삼는다 — 실제 토큰 매핑은 구현이 정한다.

import { miniViewDensity } from "@/screens/adminHome/model/miniViewDensity.policy";

describe("miniViewDensity — 안 연 날은 빈칸이다", () => {
  it("isOpen이 false면 null이다", () => {
    const density = miniViewDensity({
      isOpen: false,
      assignedCount: 5,
      maxAssignedCount: 10,
    });

    expect(density).toBeNull();
  });
});

describe("miniViewDensity — 배정 인원이 많을수록 값이 커진다", () => {
  it("배정이 없으면 가장 옅은 0이다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 0,
      maxAssignedCount: 10,
    });

    expect(density).toBe(0);
  });

  it("이 달 최대치와 같으면 가장 진한 1이다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 10,
      maxAssignedCount: 10,
    });

    expect(density).toBe(1);
  });

  it("절반이면 0.5다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 5,
      maxAssignedCount: 10,
    });

    expect(density).toBe(0.5);
  });
});

describe("miniViewDensity — 이 달에 배정이 하나도 없으면 나눗셈이 안 터진다", () => {
  it("maxAssignedCount가 0이면 0이다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 0,
      maxAssignedCount: 0,
    });

    expect(density).toBe(0);
  });
});
