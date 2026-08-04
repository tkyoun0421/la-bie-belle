import { describe, expect, it } from "vitest";

import { loadContract, parseContract } from "../contract.mjs";

const VALID = {
  layers: ["app", "views", "shared"],
  segments: {
    ui: {
      unitTest: "exempt",
      verifiedBy: ["e2e"],
      runtimeExports: true,
      forbidImports: ["server-only"],
    },
    model: {
      unitTest: "required",
      verifiedBy: ["unit"],
      runtimeExports: true,
      forbidImports: ["react"],
    },
    types: { unitTest: "exempt", verifiedBy: [], runtimeExports: false },
  },
  exemptPaths: ["**/generated/**"],
  naming: {
    folder: "kebab-case",
    file: "kebab-case",
    componentFile: "PascalCase",
    hookFile: "use-kebab-case",
    exceptions: ["src/app/**"],
  },
};

describe("parseContract", () => {
  it("계층 순서를 의존 방향으로 읽는다", () => {
    const contract = parseContract(VALID);
    expect(contract.layerRank("app")).toBe(0);
    expect(contract.layerRank("shared")).toBe(2);
    expect(contract.layerRank("nope")).toBeNull();
  });

  it("상위 계층만 하위 계층을 import할 수 있다", () => {
    const contract = parseContract(VALID);
    expect(contract.canImport("views", "shared")).toBe(true);
    expect(contract.canImport("shared", "views")).toBe(false);
  });

  it("같은 계층끼리는 import할 수 없다", () => {
    const contract = parseContract(VALID);
    expect(contract.canImport("views", "views")).toBe(false);
  });

  it("세그먼트 정의를 조회한다", () => {
    const contract = parseContract(VALID);
    expect(contract.segment("types").runtimeExports).toBe(false);
    expect(contract.segment("model").forbidImports).toEqual(["react"]);
    expect(contract.segment("없는것")).toBeNull();
  });

  it("허용된 세그먼트 이름 목록을 준다", () => {
    expect(parseContract(VALID).segmentNames).toEqual(["ui", "model", "types"]);
  });

  it("면제 경로를 판정한다", () => {
    const contract = parseContract(VALID);
    expect(contract.isExemptPath("src/shared/api/generated/db.types.ts")).toBe(true);
    expect(contract.isExemptPath("src/shared/api/client.ts")).toBe(false);
  });

  it("면제 경로는 디렉터리 이름 전체가 일치할 때만 맞는다", () => {
    const contract = parseContract(VALID);
    expect(contract.isExemptPath("src/g/e/n/e/r/a/t/e/d/thing.ts")).toBe(false);
    expect(contract.isExemptPath("src/shared/generated-helper/thing.ts")).toBe(false);
    expect(contract.isExemptPath("src/shared/pre-generated/thing.ts")).toBe(false);
  });

  it("면제 경로는 중간 디렉터리 깊이와 무관하게 맞는다", () => {
    const contract = parseContract(VALID);
    expect(contract.isExemptPath("generated/a.ts")).toBe(true);
    expect(contract.isExemptPath("src/a/b/c/generated/deep/a.ts")).toBe(true);
  });

  it("네이밍 예외 glob이 실제 파일 경로에 맞는다", () => {
    const contract = parseContract(VALID);
    expect(contract.isNamingException("src/app/page.tsx")).toBe(true);
    expect(contract.isNamingException("src/app/shift/[id]/page.tsx")).toBe(true);
    expect(contract.isNamingException("src/views/shift/ui/Card.tsx")).toBe(false);
  });

  it("forbidImports가 없으면 빈 배열로 정규화한다", () => {
    expect(parseContract(VALID).segment("types").forbidImports).toEqual([]);
  });

  it("requireServerOnly 기본값은 false다", () => {
    expect(parseContract(VALID).segment("ui").requireServerOnly).toBe(false);
  });
});

describe("parseContract 형식 검증", () => {
  it("layers가 없으면 어느 필드가 잘못됐는지 알린다", () => {
    expect(() => parseContract({ segments: {} })).toThrow(/layers/);
  });

  it("layers가 빈 배열이면 거부한다", () => {
    expect(() => parseContract({ layers: [], segments: {} })).toThrow(/layers/);
  });

  it("segments가 없으면 거부한다", () => {
    expect(() => parseContract({ layers: ["app"] })).toThrow(/segments/);
  });

  it("unitTest가 exempt/required가 아니면 거부한다", () => {
    const broken = {
      layers: ["app"],
      segments: { ui: { unitTest: "maybe", runtimeExports: true } },
    };
    expect(() => parseContract(broken)).toThrow(/unitTest/);
  });

  it("runtimeExports가 허용된 세 값이 아니면 거부한다", () => {
    const broken = {
      layers: ["app"],
      segments: { ui: { unitTest: "exempt", runtimeExports: "yes" } },
    };
    expect(() => parseContract(broken)).toThrow(/runtimeExports/);
  });

  it("runtimeExports는 constants를 허용한다", () => {
    const ok = {
      layers: ["app"],
      segments: { config: { unitTest: "exempt", runtimeExports: "constants" } },
    };
    expect(parseContract(ok).segment("config").runtimeExports).toBe("constants");
  });

  it("계약 오류 메시지는 한국어다", () => {
    expect(() => parseContract({})).toThrow(/[가-힣]/);
  });
});

describe("appLayer", () => {
  it("표현 파일은 테스트를 요구하지 않는다", () => {
    const contract = loadContract(process.cwd());
    expect(contract.appFileNeedsTest("page.tsx")).toBe(false);
    expect(contract.appFileNeedsTest("layout.tsx")).toBe(false);
    expect(contract.appFileNeedsTest("not-found.tsx")).toBe(false);
  });

  it("route.ts는 엔드포인트라 테스트를 요구한다", () => {
    const contract = loadContract(process.cwd());
    expect(contract.appFileNeedsTest("route.ts")).toBe(true);
  });

  it("appLayer가 없으면 기본값은 required다", () => {
    const contract = parseContract({ layers: ["app"], segments: {} });
    expect(contract.appLayer.unitTest).toBe("required");
    expect(contract.appFileNeedsTest("route.ts")).toBe(true);
  });

  it("appLayer.unitTest가 잘못되면 거부한다", () => {
    const broken = { layers: ["app"], segments: {}, appLayer: { unitTest: "maybe" } };
    expect(() => parseContract(broken)).toThrow(/appLayer/);
  });
});

describe("loadContract", () => {
  it("저장소의 config/fsd.json을 읽는다", () => {
    const contract = loadContract(process.cwd());
    expect(contract.segmentNames).toContain("model");
    expect(contract.segment("config").runtimeExports).toBe("constants");
    expect(contract.segment("types").runtimeExports).toBe(false);
    expect(contract.canImport("views", "entities")).toBe(true);
    expect(contract.canImport("entities", "views")).toBe(false);
  });
});
