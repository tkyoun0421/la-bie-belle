import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  e2eFileViolations,
  repositoryE2eFileViolations,
} from "@tests/lint/e2eFileReferences";

let root: string;

function put(relative: string, content = "") {
  const absolute = path.join(root, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

const SEEDED_FLOW = `# 머리말 주석 — scripts/old-name.js는 주석이라 안 본다
appId: com.example.app
---
- launchApp:
    clearState: true
- runScript:
    file: scripts/seedSession.js
    env:
      STATE: fresh
- assertVisible: "file: nothing.js"
`;

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "e2e-file-references-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("e2e 플로우가 파일로 읽는 경로가 플로우 옆에 있다", () => {
  it("runScript의 file이 플로우 기준 상대 경로로 있으면 위반이 없다", () => {
    put("tests/e2e/scripts/seedSession.js");

    expect(
      e2eFileViolations("tests/e2e/session.yaml", SEEDED_FLOW, root),
    ).toEqual([]);
  });

  it("runScript의 file이 가리키는 스크립트가 없으면 위반이다", () => {
    put("tests/e2e/scripts/seedSession.js");

    expect(
      e2eFileViolations(
        "tests/e2e/session.yaml",
        SEEDED_FLOW.replace("seedSession.js", "seed-session.js"),
        root,
      ),
    ).toEqual([
      {
        file: "tests/e2e/session.yaml",
        key: "runScript",
        reference: "scripts/seed-session.js",
      },
    ]);
  });

  it("저장소 루트 기준으로만 있는 파일은 플로우 기준으로 없으니 위반이다", () => {
    put("scripts/seedSession.js");

    expect(
      e2eFileViolations("tests/e2e/session.yaml", SEEDED_FLOW, root),
    ).toEqual([
      {
        file: "tests/e2e/session.yaml",
        key: "runScript",
        reference: "scripts/seedSession.js",
      },
    ]);
  });

  it("runFlow를 한 줄로 쓴 경로가 없으면 위반이다", () => {
    put("tests/e2e/login.yaml");

    expect(
      e2eFileViolations(
        "tests/e2e/home.yaml",
        `appId: x\n---\n- runFlow: login.yaml\n- runFlow: "profile.yaml"\n`,
        root,
      ),
    ).toEqual([
      {
        file: "tests/e2e/home.yaml",
        key: "runFlow",
        reference: "profile.yaml",
      },
    ]);
  });

  it("runFlow를 file 키로 쓴 경로가 없으면 위반이다", () => {
    expect(
      e2eFileViolations(
        "tests/e2e/home.yaml",
        `appId: x\n---\n- runFlow:\n    file: subflows/login.yaml\n    env:\n      NAME: a\n`,
        root,
      ),
    ).toEqual([
      {
        file: "tests/e2e/home.yaml",
        key: "runFlow",
        reference: "subflows/login.yaml",
      },
    ]);
  });

  it("runScript를 한 줄로 쓴 경로도 본다", () => {
    expect(
      e2eFileViolations(
        "tests/e2e/a.yaml",
        `appId: x\n---\n- runScript: scripts/missing.js\n`,
        root,
      ),
    ).toEqual([
      {
        file: "tests/e2e/a.yaml",
        key: "runScript",
        reference: "scripts/missing.js",
      },
    ]);
  });

  it("repeat 안에 들여 쓴 runScript도 본다", () => {
    expect(
      e2eFileViolations(
        "tests/e2e/a.yaml",
        `appId: x\n---\n- repeat:\n    times: 2\n    commands:\n      - runScript:\n          file: scripts/missing.js\n`,
        root,
      ),
    ).toEqual([
      {
        file: "tests/e2e/a.yaml",
        key: "runScript",
        reference: "scripts/missing.js",
      },
    ]);
  });

  it("runScript 블록이 끝난 뒤 다른 명령의 file은 보지 않는다", () => {
    put("tests/e2e/scripts/seedSession.js");

    expect(
      e2eFileViolations(
        "tests/e2e/a.yaml",
        `appId: x\n---\n- runScript:\n    file: scripts/seedSession.js\n- addMedia:\n    file: not-a-flow-key.png\n`,
        root,
      ),
    ).toEqual([]);
  });

  it("commands로 안에 적은 runFlow는 파일을 안 읽으니 보지 않는다", () => {
    expect(
      e2eFileViolations(
        "tests/e2e/a.yaml",
        `appId: x\n---\n- runFlow:\n    commands:\n      - tapOn: "확인"\n`,
        root,
      ),
    ).toEqual([]);
  });

  it("가짜 트리의 e2e 폴더에서 깨진 참조를 플로우마다 잡는다", () => {
    put("tests/e2e/scripts/seedSession.js");
    put("tests/e2e/session.yaml", SEEDED_FLOW);
    put(
      "tests/e2e/admin.yaml",
      SEEDED_FLOW.replace("seedSession.js", "seed-session.js"),
    );
    put("tests/e2e/nested/me.yml", `appId: x\n---\n- runFlow: profile.yaml\n`);

    expect(repositoryE2eFileViolations(root)).toEqual(
      expect.arrayContaining([
        {
          file: path.join("tests/e2e", "admin.yaml"),
          key: "runScript",
          reference: "scripts/seed-session.js",
        },
        {
          file: path.join("tests/e2e", "nested", "me.yml"),
          key: "runFlow",
          reference: "profile.yaml",
        },
      ]),
    );
    expect(repositoryE2eFileViolations(root)).toHaveLength(2);
  });

  it("저장소의 e2e 플로우가 가리키는 파일이 전부 있다", () => {
    expect(repositoryE2eFileViolations()).toEqual([]);
  });
});
