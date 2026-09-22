import {
  caseCollisions,
  describeFileNamingViolation,
  EXCLUDED_PREFIXES,
  fileNamingViolations,
  matchesStyle,
  repositoryCodeFiles,
  repositoryFileNamingViolations,
  SCOPES,
  stemOf,
  styleFor,
  styleViolations,
  toStyle,
} from "@tests/lint/file-naming";

const HOOK_SOURCE = `import { useState } from "react";

export function useAuthGate() {
  return useState(false);
}
`;

const PLAIN_SOURCE = `export const MINUTES = 5;\n`;

/**
 * 어긋난 이름을 글자로 들고 있어야 검사가 무는 것을 확인할 수 있다. 이름을 바꾸는 일괄
 * 치환이 이 파일을 지나가면 픽스처가 정답으로 바뀌어 단언이 조용히 무의미해진다 —
 * 그래서 픽스처를 한자리에 모아 둔다.
 */
const BAD = {
  kebabWanted: "src/shared/api/databaseTypes.ts",
  kebabWantedTest: "tests/lint/databaseTypes.test.ts",
  pascalWanted: "src/shared/ui/not-built-yet.tsx",
  hookWanted: "src/features/auth/use-auth-gate.ts",
};

describe("확장자 앞의 첫 조각을 이름으로 본다", () => {
  it("겹친 확장자를 다 뗀다", () => {
    expect(stemOf("check-in.integration.test.ts")).toBe("check-in");
    expect(stemOf("database-types.ts")).toBe("database-types");
    expect(stemOf("NotBuiltYet.tsx")).toBe("NotBuiltYet");
  });

  it("점이 없으면 그대로다", () => {
    expect(stemOf("Makefile")).toBe("Makefile");
  });
});

describe("무엇이 들었는지가 갈래를 정한다", () => {
  it("`.tsx`는 컴포넌트다", () => {
    expect(styleFor("src/shared/ui/NotBuiltYet.tsx", "")).toBe("pascal");
  });

  it("`use`로 시작하는 함수를 내놓으면 훅이다", () => {
    expect(styleFor("src/features/auth/useAuthGate.ts", HOOK_SOURCE)).toBe(
      "hook",
    );
  });

  it("그 밖은 kebab이다", () => {
    expect(
      styleFor("src/entities/attendance/model/constants.ts", PLAIN_SOURCE),
    ).toBe("kebab");
  });

  /** `tests/`의 픽스처가 잡히려고 훅 코드를 글자로 들고 있다. */
  it("`tests/` 안에서는 훅 판정을 안 한다", () => {
    expect(styleFor("tests/lint/unused-imports.test.ts", HOOK_SOURCE)).toBe(
      "kebab",
    );
  });
});

describe("갈래별 이름 판정", () => {
  it("kebab은 소문자와 하이픈만 받는다", () => {
    expect(matchesStyle("check-in", "kebab")).toBe(true);
    expect(matchesStyle("constants", "kebab")).toBe(true);
    expect(matchesStyle("adr005", "kebab")).toBe(true);
    expect(matchesStyle("checkIn", "kebab")).toBe(false);
    expect(matchesStyle("check_in", "kebab")).toBe(false);
    expect(matchesStyle("CheckIn", "kebab")).toBe(false);
    expect(matchesStyle("check--in", "kebab")).toBe(false);
  });

  it("컴포넌트는 대문자로 시작해 붙여 쓴다", () => {
    expect(matchesStyle("NotBuiltYet", "pascal")).toBe(true);
    expect(matchesStyle("not-built-yet", "pascal")).toBe(false);
    expect(matchesStyle("notBuiltYet", "pascal")).toBe(false);
  });

  it("훅은 `use` 뒤에 대문자가 온다", () => {
    expect(matchesStyle("useAuthGate", "hook")).toBe(true);
    expect(matchesStyle("use-auth-gate", "hook")).toBe(false);
    expect(matchesStyle("useauthgate", "hook")).toBe(false);
    expect(matchesStyle("UseAuthGate", "hook")).toBe(false);
  });
});

describe("고칠 이름을 낸다", () => {
  it("kebab으로 접는다", () => {
    expect(toStyle("databaseTypes", "kebab")).toBe("database-types");
    expect(toStyle("NotBuiltYet", "kebab")).toBe("not-built-yet");
    expect(toStyle("check_in", "kebab")).toBe("check-in");
    expect(toStyle("check-in", "kebab")).toBe("check-in");
  });

  it("PascalCase로 접는다", () => {
    expect(toStyle("not-built-yet", "pascal")).toBe("NotBuiltYet");
    expect(toStyle("NotBuiltYet", "pascal")).toBe("NotBuiltYet");
  });

  it("훅 이름으로 접고 `use`를 두 번 안 붙인다", () => {
    expect(toStyle("use-auth-gate", "hook")).toBe("useAuthGate");
    expect(toStyle("useAuthGate", "hook")).toBe("useAuthGate");
  });
});

describe("이름이 어긋난 파일", () => {
  it("코드 확장자만 본다", () => {
    expect(
      styleViolations([
        { file: BAD.kebabWanted, source: PLAIN_SOURCE },
        { file: "src/app/globals.css", source: "" },
        { file: "docs/2-design/system/data-access.md", source: "" },
      ]),
    ).toEqual([
      {
        type: "style",
        file: BAD.kebabWanted,
        style: "kebab",
        suggestion: "src/shared/api/database-types.ts",
      },
    ]);
  });

  it("겹친 확장자를 그대로 붙여 낸다", () => {
    expect(
      styleViolations([{ file: BAD.kebabWantedTest, source: PLAIN_SOURCE }]),
    ).toEqual([
      {
        type: "style",
        file: BAD.kebabWantedTest,
        style: "kebab",
        suggestion: "tests/lint/database-types.test.ts",
      },
    ]);
  });

  it("컴포넌트가 kebab이면 잡는다", () => {
    expect(styleViolations([{ file: BAD.pascalWanted, source: "" }])).toEqual([
      {
        type: "style",
        file: BAD.pascalWanted,
        style: "pascal",
        suggestion: "src/shared/ui/NotBuiltYet.tsx",
      },
    ]);
  });

  it("훅이 kebab이면 잡는다", () => {
    expect(
      styleViolations([{ file: BAD.hookWanted, source: HOOK_SOURCE }]),
    ).toEqual([
      {
        type: "style",
        file: BAD.hookWanted,
        style: "hook",
        suggestion: "src/features/auth/useAuthGate.ts",
      },
    ]);
  });

  /**
   * Expo Router가 파일 이름을 URL로 읽는다 — `check-in.tsx`가 `/check-in`이고 그 주소는
   * 종이 QR에 실린다. 여기서 `.tsx`는 컴포넌트가 아니다.
   */
  it("`src/app/`은 안 본다", () => {
    expect(
      styleViolations([{ file: "src/app/check-in.tsx", source: "" }]),
    ).toEqual([]);
    expect(EXCLUDED_PREFIXES).toContain("src/app/");
  });

  it("규약에 맞으면 빈 목록이다", () => {
    expect(
      styleViolations([
        { file: "src/shared/api/database-types.ts", source: PLAIN_SOURCE },
        { file: "src/shared/ui/NotBuiltYet.tsx", source: "" },
        { file: "src/features/auth/useAuthGate.ts", source: HOOK_SOURCE },
      ]),
    ).toEqual([]);
  });
});

describe("케이스만 다른 파일", () => {
  it("한 짝으로 묶어 낸다", () => {
    expect(
      caseCollisions([
        { file: "src/shared/ui/Button.tsx", source: "" },
        { file: "src/shared/ui/button.tsx", source: "" },
        { file: "src/shared/ui/NotBuiltYet.tsx", source: "" },
      ]),
    ).toEqual([
      {
        type: "case-collision",
        files: ["src/shared/ui/Button.tsx", "src/shared/ui/button.tsx"],
      },
    ]);
  });

  it("디렉터리가 다르면 겹치지 않는다", () => {
    expect(
      caseCollisions([
        { file: "src/shared/ui/Button.tsx", source: "" },
        { file: "src/screens/me/Button.tsx", source: "" },
      ]),
    ).toEqual([]);
  });
});

describe("위반을 사람이 읽는 문장으로 옮긴다", () => {
  it("옮길 이름을 같이 든다", () => {
    const message = describeFileNamingViolation({
      type: "style",
      file: BAD.kebabWanted,
      style: "kebab",
      suggestion: "src/shared/api/database-types.ts",
    });

    expect(message).toContain(BAD.kebabWanted);
    expect(message).toContain("src/shared/api/database-types.ts");
    expect(message).toContain("kebab-case");
  });

  it("케이스 충돌은 왜 깨지는지 든다", () => {
    const message = describeFileNamingViolation({
      type: "case-collision",
      files: ["src/shared/ui/Button.tsx", "src/shared/ui/button.tsx"],
    });

    expect(message).toContain("src/shared/ui/Button.tsx");
    expect(message).toContain("macOS");
  });
});

describe("저장소 실물", () => {
  it("검사 범위 넷을 든다", () => {
    expect(SCOPES).toEqual(["src", "tests", "scripts", "eslint-rules"]);
  });

  /** 범위가 비면 검사가 통째로 꺼진 것을 통과로 읽는다. */
  it("범위 안에서 코드 파일을 실제로 읽어낸다", () => {
    expect(repositoryCodeFiles().length).toBeGreaterThan(100);
  });

  it("위반이 없다", () => {
    expect(
      repositoryFileNamingViolations().map(describeFileNamingViolation),
    ).toEqual([]);
  });

  it("두 검사를 다 돌린다", () => {
    const files = [
      { file: BAD.pascalWanted, source: "" },
      { file: "src/shared/ui/Button.tsx", source: "" },
      { file: "src/shared/ui/button.tsx", source: "" },
    ];

    expect(fileNamingViolations(files).map(({ type }) => type)).toEqual([
      "style",
      "style",
      "case-collision",
    ]);
  });
});
