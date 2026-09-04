import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  droppedContrastRows,
  measuredContrastRows,
  parseComboCell,
  parseDroppedComboCell,
  resolveTokenHex,
} from "@tests/lint/contrast-check";

const TOKENS_MARKDOWN = readFileSync(
  path.join(process.cwd(), "docs/2-design/design-system/tokens.md"),
  "utf8",
);

const AA_THRESHOLD = 4.5;

function titleOf(left: string, right: string): string {
  return `${left} / ${right}`;
}

describe("리스크 10 — WCAG 공식 자체를 tokens.md와 무관한 표준 벡터로 검증한다", () => {
  it("흰색과 검정의 대비는 21:1이다", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 4);
  });

  it("같은 색끼리의 대비는 1:1이다", () => {
    expect(contrastRatio("#334455", "#334455")).toBeCloseTo(1, 5);
  });
});

describe("리스크 7 — 밝은쪽/어두운쪽을 순서가 아니라 휘도로 가른다", () => {
  it("두 색의 인자 순서를 바꿔도 대비값이 같다", () => {
    const forward = contrastRatio("#112233", "#EEDDCC");
    const backward = contrastRatio("#EEDDCC", "#112233");

    expect(backward).toBe(forward);
  });

  it("첫 인자가 더 어두운 색이어도(다크 팔레트처럼 fg가 밝은 경우) 1 미만으로 떨어지지 않는다", () => {
    expect(contrastRatio("#0D0C0B", "#ECE9E6")).toBeGreaterThan(1);
  });
});

describe("리스크 3 — cellsOf가 벗기지 못한 가운데 백틱을 파서가 마저 지운다", () => {
  it("`fg.neutral` on `bg.neutral` 형태를 나누면 양쪽에 백틱이 남지 않는다", () => {
    const combo = parseComboCell("`fg.neutral` on `bg.neutral`");

    expect(combo).toEqual({ left: "fg.neutral", right: "bg.neutral" });
  });
});

describe("리스크 5 — on이 아니라 vs로 나뉜 행도 좌우를 가른다", () => {
  it("brand-800 vs warning-800 을 좌우로 정확히 가른다", () => {
    const combo = parseDroppedComboCell("brand-800 vs warning-800 (라이트)");

    expect(combo.left).toBe("brand-800");
    expect(combo.right).toBe("warning-800");
  });
});

describe("리스크 6 — (라이트)/(다크) 꼬리로 테마를 정한다", () => {
  it("(라이트) 꼬리는 테마를 라이트로 읽는다", () => {
    const combo = parseDroppedComboCell("neutral-600 on `bg.neutral` (라이트)");

    expect(combo.theme).toBe("light");
  });

  it("실데이터에는 없는 (다크) 꼬리도 테마를 다크로 읽는다", () => {
    const combo = parseDroppedComboCell(
      "`fg.neutral-subtle` on `bg.informative-weak` (다크)",
    );

    expect(combo.theme).toBe("dark");
  });
});

describe("리스크 4 — 팔레트 단계와 역할 토큰을 점(.)의 유무로 구분한다", () => {
  it("점이 있는 역할 토큰은 2절 매핑을 거쳐 1절 hex를 찾는다", () => {
    expect(resolveTokenHex(TOKENS_MARKDOWN, "fg.neutral", "light")).toBe(
      "#1B1917",
    );
    expect(resolveTokenHex(TOKENS_MARKDOWN, "fg.neutral", "dark")).toBe(
      "#ECE9E6",
    );
  });

  it("점이 없는 팔레트 단계는 2절을 거치지 않고 1절을 곧장 찾는다", () => {
    expect(resolveTokenHex(TOKENS_MARKDOWN, "neutral-600", "light")).toBe(
      "#8A8785",
    );
    expect(resolveTokenHex(TOKENS_MARKDOWN, "brand-800", "dark")).toBe(
      "#C7A48C",
    );
  });
});

describe("리스크 1·2 — 표 두 개가 통째로 안 읽히거나 일부 행만 스킵되면 행 수가 어긋난다", () => {
  it("측정한 조합 표는 16행이다", () => {
    expect(measuredContrastRows(TOKENS_MARKDOWN)).toHaveLength(16);
  });

  it("떨어진 조합 표는 4행이다", () => {
    expect(droppedContrastRows(TOKENS_MARKDOWN)).toHaveLength(4);
  });
});

describe("완료 조건 — 측정한 조합의 재계산값이 표에 적힌 라이트 값과 같다", () => {
  const cases = measuredContrastRows(TOKENS_MARKDOWN).map(
    (row) => [titleOf(row.combo.left, row.combo.right), row] as const,
  );

  it.each(cases)("%s", (_title, row) => {
    expect(row.recomputed.light).toBeCloseTo(row.reported.light, 2);
  });
});

describe("완료 조건 — 측정한 조합의 재계산값이 표에 적힌 다크 값과 같다", () => {
  const cases = measuredContrastRows(TOKENS_MARKDOWN).map(
    (row) => [titleOf(row.combo.left, row.combo.right), row] as const,
  );

  it.each(cases)("%s", (_title, row) => {
    expect(row.recomputed.dark).toBeCloseTo(row.reported.dark, 2);
  });
});

describe("완료 조건 — 떨어진 조합의 재계산값이 표에 적힌 결과값과 같다", () => {
  const cases = droppedContrastRows(TOKENS_MARKDOWN).map(
    (row) =>
      [
        `${titleOf(row.combo.left, row.combo.right)} (${row.combo.theme})`,
        row,
      ] as const,
  );

  it.each(cases)("%s", (_title, row) => {
    expect(row.recomputed).toBeCloseTo(row.reported, 2);
  });
});

describe("완료 조건 — 측정한 조합은 재계산값 기준으로 4.5:1 아래로 내려가지 않는다", () => {
  const cases = measuredContrastRows(TOKENS_MARKDOWN).map(
    (row) => [titleOf(row.combo.left, row.combo.right), row] as const,
  );

  it.each(cases)("%s 라이트 재계산값이 4.5 이상이다", (_title, row) => {
    expect(row.recomputed.light).toBeGreaterThanOrEqual(AA_THRESHOLD);
  });

  it.each(cases)("%s 다크 재계산값이 4.5 이상이다", (_title, row) => {
    expect(row.recomputed.dark).toBeGreaterThanOrEqual(AA_THRESHOLD);
  });
});

describe("완료 조건 — 4.5 판정을 표기값이 아니라 실제값으로 가른다", () => {
  const boundary = measuredContrastRows(TOKENS_MARKDOWN).filter(
    (row) =>
      row.combo.left === "fg.neutral-disabled" &&
      row.combo.right === "bg.neutral-disabled",
  );

  it("4.5 경계에 붙은 행이 표에 하나 있다", () => {
    expect(boundary).toHaveLength(1);
  });

  it.each(boundary.map((row) => [row.recomputed.light] as const))(
    "재계산한 라이트 값 %s 는 자기 자신을 둘째 자리로 반올림한 값과 다르다",
    (light) => {
      expect(light).not.toBe(Math.round(light * 100) / 100);
    },
  );
});
