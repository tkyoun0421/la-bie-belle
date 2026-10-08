import fs from "node:fs";
import path from "node:path";

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
} from "@tests/lint/fileNaming";

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
  camelWanted: "src/shared/api/database-types.ts",
  camelWantedTest: "tests/lint/database-types.test.ts",
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

  it("그 밖은 camel이다", () => {
    expect(
      styleFor("src/entities/attendance/model/constants.ts", PLAIN_SOURCE),
    ).toBe("camel");
  });

  /** `tests/`의 픽스처가 잡히려고 훅 코드를 글자로 들고 있다. */
  it("`tests/` 안에서는 훅 판정을 안 한다", () => {
    expect(styleFor("tests/lint/unusedImports.test.ts", HOOK_SOURCE)).toBe(
      "camel",
    );
  });

  /**
   * zustand의 `create`가 돌려주는 것은 훅이라 store 파일은 「훅 파일은 그 훅 이름」과
   * 부딪힌다. ADR-015가 `stores/` 폴더에 성격을 맡겨 그 자리에서는 접미사가 이긴다 —
   * `theme.store.ts`가 `useTheme`을 내놓아도 이름을 안 바꾼다.
   */
  it("`stores/`의 `.store.ts`는 훅을 내놓아도 접미사가 이름이다", () => {
    expect(styleFor("src/shared/stores/theme.store.ts", HOOK_SOURCE)).toBe(
      "camel",
    );
  });

  /**
   * Context를 읽는 손도 훅이라 같은 자리에 선다. ADR-015의 「파일 이름」 표가
   * `[domain].context.ts`를 「React Context와 그것을 읽는 훅」으로 적어, 훅을 내놓는 것이
   * 그 접미사의 정의다.
   */
  it("`stores/`의 `.context.ts`도 훅을 내놓아도 접미사가 이름이다", () => {
    expect(styleFor("src/shared/stores/drag.context.ts", HOOK_SOURCE)).toBe(
      "camel",
    );
  });

  /** 같은 폴더의 다른 파일은 면제 밖이다 — 훅을 내놓으면 훅 이름을 받는다. */
  it("`stores/`의 접미사 둘이 아닌 파일은 훅 판정을 받는다", () => {
    expect(styleFor("src/shared/stores/themeGate.ts", HOOK_SOURCE)).toBe(
      "hook",
    );
  });
});

describe("갈래별 이름 판정", () => {
  it("camel은 소문자로 시작해 붙여 쓴다", () => {
    expect(matchesStyle("checkIn", "camel")).toBe(true);
    expect(matchesStyle("constants", "camel")).toBe(true);
    expect(matchesStyle("adr005", "camel")).toBe(true);
    expect(matchesStyle("check-in", "camel")).toBe(false);
    expect(matchesStyle("check_in", "camel")).toBe(false);
    expect(matchesStyle("CheckIn", "camel")).toBe(false);
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
  it("camel로 접는다", () => {
    expect(toStyle("database-types", "camel")).toBe("databaseTypes");
    expect(toStyle("NotBuiltYet", "camel")).toBe("notBuiltYet");
    expect(toStyle("check_in", "camel")).toBe("checkIn");
    expect(toStyle("checkIn", "camel")).toBe("checkIn");
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
        { file: BAD.camelWanted, source: PLAIN_SOURCE },
        { file: "src/app/globals.css", source: "" },
        { file: "docs/2-design/system/data-access.md", source: "" },
      ]),
    ).toEqual([
      {
        type: "style",
        file: BAD.camelWanted,
        style: "camel",
        suggestion: "src/shared/api/databaseTypes.ts",
      },
    ]);
  });

  it("겹친 확장자를 그대로 붙여 낸다", () => {
    expect(
      styleViolations([{ file: BAD.camelWantedTest, source: PLAIN_SOURCE }]),
    ).toEqual([
      {
        type: "style",
        file: BAD.camelWantedTest,
        style: "camel",
        suggestion: "tests/lint/databaseTypes.test.ts",
      },
    ]);
  });

  it("컴포넌트가 camel이면 잡는다", () => {
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
        { file: "src/shared/api/databaseTypes.ts", source: PLAIN_SOURCE },
        { file: "src/shared/ui/NotBuiltYet.tsx", source: "" },
        { file: "src/features/auth/useAuthGate.ts", source: HOOK_SOURCE },
      ]),
    ).toEqual([]);
  });
});

describe("__tests__ 안 짝 테스트는 대상의 갈래를 따른다", () => {
  const HOOK_TARGET_SOURCE = `import { useState } from "react";

export function useMyProfile() {
  return useState(null);
}
`;

  it("훅 대상이 있으면 camelCase 짝 테스트는 위반이 아니다", () => {
    expect(
      styleViolations([
        {
          file: "src/features/profile/model/useMyProfile.ts",
          source: HOOK_TARGET_SOURCE,
        },
        {
          file: "src/features/profile/model/__tests__/useMyProfile.test.ts",
          source: PLAIN_SOURCE,
        },
      ]),
    ).toEqual([]);
  });

  it("대상이 아직 없어도 use로 시작하는 camelCase 짝 테스트는 훅 짝으로 읽는다", () => {
    // TDD라 테스트가 훅보다 먼저 선다 — 그 사이에 camel을 요구하면 훅이 서는 순간 다시
    // 이름을 바꿔야 한다. 세 task에서 같은 마찰이 났다.
    expect(
      styleViolations([
        {
          file: "src/features/profile/model/__tests__/useMyProfile.test.ts",
          source: PLAIN_SOURCE,
        },
      ]),
    ).toEqual([]);
  });

  it("대상이 없고 use로도 시작하지 않는 짝 테스트는 camel을 요구한다", () => {
    expect(
      styleViolations([
        {
          file: "src/features/profile/model/__tests__/my-profile.test.ts",
          source: PLAIN_SOURCE,
        },
      ]),
    ).toEqual([
      {
        type: "style",
        file: "src/features/profile/model/__tests__/my-profile.test.ts",
        style: "camel",
        suggestion: "src/features/profile/model/__tests__/myProfile.test.ts",
      },
    ]);
  });

  it("camel 대상의 camel 짝은 위반이 아니다", () => {
    expect(
      styleViolations([
        {
          file: "src/entities/attendance/model/price.ts",
          source: PLAIN_SOURCE,
        },
        {
          file: "src/entities/attendance/model/__tests__/price.test.ts",
          source: PLAIN_SOURCE,
        },
      ]),
    ).toEqual([]);
  });
});

describe("점으로 시작하는 디렉터리는 훑지 않는다", () => {
  const tmpRoot = path.join(process.cwd(), "tests/lint/.tmp-fileNaming-walk");

  beforeAll(() => {
    for (const scope of SCOPES) {
      fs.mkdirSync(path.join(tmpRoot, scope), { recursive: true });
    }
    fs.mkdirSync(path.join(tmpRoot, "src/.hidden"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpRoot, "src/.hidden/inside.ts"),
      PLAIN_SOURCE,
      "utf8",
    );
    fs.writeFileSync(
      path.join(tmpRoot, "src/visible.ts"),
      PLAIN_SOURCE,
      "utf8",
    );
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("점 디렉터리 안 파일은 walk 결과에 안 든다", () => {
    const files = repositoryCodeFiles(tmpRoot).map(({ file }) => file);

    expect(files).toContain("src/visible.ts");
    expect(files).not.toContain("src/.hidden/inside.ts");
  });
});

describe("이름이 어긋난 폴더", () => {
  it("하이픈 든 슬라이스 폴더를 잡는다", async () => {
    const { folderViolations } = await import("@tests/lint/fileNaming");

    expect(
      folderViolations([
        {
          file: "src/screens/admin-home/ui/AdminHomeScreen.tsx",
          source: "",
        },
      ]),
    ).toEqual([
      {
        type: "folder",
        folder: "src/screens/admin-home",
        suggestion: "src/screens/adminHome",
      },
    ]);
  });

  /** 범위의 첫 조각은 저장소 맨 위 이름이라 이 규약의 대상이 아니다. */
  it("범위 이름 자체는 안 본다", async () => {
    const { folderViolations } = await import("@tests/lint/fileNaming");

    expect(
      folderViolations([{ file: "eslint-rules/dumbUi.mjs", source: "" }]),
    ).toEqual([]);
  });

  it("`src/app/`은 안 본다", async () => {
    const { folderViolations } = await import("@tests/lint/fileNaming");

    expect(
      folderViolations([{ file: "src/app/(admin)/check-in.tsx", source: "" }]),
    ).toEqual([]);
  });

  /** Jest가 그 이름으로 짝 테스트 자리를 안다. */
  it("`__tests__`는 밖이다", async () => {
    const { folderViolations } = await import("@tests/lint/fileNaming");

    expect(
      folderViolations([
        {
          file: "src/entities/attendance/model/__tests__/price.test.ts",
          source: PLAIN_SOURCE,
        },
      ]),
    ).toEqual([]);
  });

  it("같은 폴더를 한 번만 낸다", async () => {
    const { folderViolations } = await import("@tests/lint/fileNaming");

    expect(
      folderViolations([
        { file: "src/screens/admin-home/model/tileMonth.ts", source: "" },
        { file: "src/screens/admin-home/model/todayStatus.ts", source: "" },
      ]),
    ).toHaveLength(1);
  });

  it("저장소 실물에 위반이 없다", async () => {
    const { folderViolations } = await import("@tests/lint/fileNaming");

    expect(folderViolations(repositoryCodeFiles())).toEqual([]);
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
      file: BAD.camelWanted,
      style: "camel",
      suggestion: "src/shared/api/databaseTypes.ts",
    });

    expect(message).toContain(BAD.camelWanted);
    expect(message).toContain("src/shared/api/databaseTypes.ts");
    expect(message).toContain("camelCase");
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
