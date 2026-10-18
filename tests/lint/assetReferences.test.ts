import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assetViolations,
  googleButtonAssetNames,
  missingGoogleButtonAssets,
  NOT_YET_DELIVERED_DIRS,
  repositoryAssetViolations,
} from "@tests/lint/assetReferences";

let root: string;

function put(relative: string, content = "") {
  const absolute = path.join(root, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "asset-references-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("코드가 가리키는 그림 파일이 저장소에 있다", () => {
  it("require로 가리킨 그림 파일이 있으면 위반이 없다", () => {
    put("src/ui/logo.png");

    expect(
      assetViolations(
        "src/ui/Logo.tsx",
        `const a = require("./logo.png");`,
        root,
      ),
    ).toEqual([]);
  });

  it("require로 가리킨 그림 파일이 없으면 위반이다", () => {
    expect(
      assetViolations(
        "src/ui/Logo.tsx",
        `const a = require("./logo.png");`,
        root,
      ),
    ).toEqual([
      {
        file: "src/ui/Logo.tsx",
        reference: "./logo.png",
        kind: "missing-file",
      },
    ]);
  });

  it("import로 가리킨 상위 폴더의 svg가 없으면 위반이다", () => {
    expect(
      assetViolations(
        "src/ui/Logo.tsx",
        `import logo from "../logo.svg";`,
        root,
      ),
    ).toEqual([
      {
        file: "src/ui/Logo.tsx",
        reference: "../logo.svg",
        kind: "missing-file",
      },
    ]);
  });

  it("require.context가 여는 폴더가 없으면 위반이다", () => {
    expect(
      assetViolations(
        "src/screens/login/ui/Button.tsx",
        `require.context("../../../../assets/google", false, /\\.svg$/)`,
        root,
      ),
    ).toEqual([
      {
        file: "src/screens/login/ui/Button.tsx",
        reference: "../../../../assets/google",
        kind: "missing-directory",
      },
    ]);
  });

  it("require.context가 여는 폴더가 있으면 위반이 없다", () => {
    put("assets/google/a.svg");

    expect(
      assetViolations(
        "src/screens/login/ui/Button.tsx",
        `require.context("../../../../assets/google", false, /\\.svg$/)`,
        root,
      ),
    ).toEqual([]);
  });

  it("그림이 아닌 상대 import는 보지 않는다", () => {
    expect(
      assetViolations("src/a.ts", `import { x } from "./missing";`, root),
    ).toEqual([]);
  });

  it("저장소의 src가 가리키는 그림 파일과 폴더가 전부 있다", () => {
    expect(repositoryAssetViolations()).toEqual([]);
  });

  it("아직 안 들어온 폴더로 면제한 자리는 폴더가 들어오면 면제 목록에서 빠진다", () => {
    const delivered = NOT_YET_DELIVERED_DIRS.filter((dir) =>
      existsSync(path.join(process.cwd(), dir)),
    );

    expect(delivered).toEqual([]);
  });

  it("면제 목록에 없는 폴더가 비어 있으면 위반이다", () => {
    put(
      "src/ui/Scene.tsx",
      `require.context("../../assets/scenes", false, /\\.webp$/)`,
    );

    expect(repositoryAssetViolations(root)).toEqual([
      {
        file: "src/ui/Scene.tsx",
        reference: "../../assets/scenes",
        kind: "missing-directory",
      },
    ]);
  });
});

describe("구글 로그인 버튼의 로고 파일이 assets/google에 있다", () => {
  it("버튼이 이름으로 고르는 파일이 전부 있다", () => {
    expect(missingGoogleButtonAssets(googleButtonAssetNames())).toEqual([]);
  });

  it("버튼이 고르는 이름의 파일이 지워지면 그 이름을 돌려준다", () => {
    put("assets/google/ios-dark.svg");

    expect(
      missingGoogleButtonAssets(["ios-dark.svg", "ios-light.svg"], root),
    ).toEqual(["ios-light.svg"]);
  });
});
