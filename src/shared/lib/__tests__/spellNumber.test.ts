// 구현 대상: src/shared/lib/spellNumber.ts (아직 없다)
//
// spellWon(amount) — 금액을 세 자리마다 쉼표로 끊고 「원」을 붙인다. 지금
// screens/payroll/model/summary.ts의 spellAmount와 screens/wages/model/
// wageAmount.ts의 spellWon이 각자 THOUSANDS 정규식을 들고 같은 값을 낸다
// (backlog spell-number-shared). 이 파일이 그 둘의 계약을 그대로 옮긴 셋째
// 자리다 — 슬라이스끼리 서로를 못 불러서(lint 규칙 3) screens/stats의 급여
// 탭이 이 셋째 사본을 세우려던 참이었다.
//
// 두 기존 파일을 읽어 확인한 계약: summary.ts의 spellAmount(amount)와
// wageAmount.ts의 spellWon(digits 문자열을 formatAmountDisplay로 거쳐 원을
// 붙인 것)이 같은 입력에 같은 문자열을 낸다 — 쉼표 위치도 「원」 접미사도
// 어긋나지 않는다. 계약 불일치는 없었다.

import { spellWon } from "@/shared/lib/spellNumber";

describe("spellWon — 세 자리마다 쉼표를 찍고 「원」을 붙인다", () => {
  it("108000은 '108,000원'이다", () => {
    expect(spellWon(108000)).toBe("108,000원");
  });

  it("백만 단위도 쉼표가 두 번 찍힌다 — '1,296,000원'", () => {
    expect(spellWon(1296000)).toBe("1,296,000원");
  });

  it("네 자리 미만은 쉼표 없이 '500원'이다", () => {
    expect(spellWon(500)).toBe("500원");
  });
});

describe("spellWon — 0원은 계산이 끝난 값이라 '0원'으로 적는다", () => {
  it("0을 넣으면 '0원'이다 — 값이 없는 자리(NO_VALUE)와 다른 자리다", () => {
    expect(spellWon(0)).toBe("0원");
  });
});
