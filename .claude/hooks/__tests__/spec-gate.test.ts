import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const hooksDir = fileURLToPath(new URL("../", import.meta.url));
const HOOK = "spec-gate.py";

const blocked = 2;
const allowed = 0;

const APPROVED_SPEC = "---\nstatus: approved\n---\n\n# 제목\n\n본문.\n";
const DRAFT_SPEC = "---\nstatus: draft\n---\n\n# 제목\n\n본문.\n";
const NO_FRONTMATTER_SPEC = "# 제목만 있고 프론트매터가 없다\n\n본문.\n";

function git(projectDir: string, args: string[]) {
  const result = spawnSync("git", args, { cwd: projectDir, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} 실패: ${result.stderr}`);
  }
  return result;
}

function createProject(branch: string) {
  const projectDir = mkdtempSync(join(tmpdir(), "spec-gate-"));
  git(projectDir, ["init", "-q", "-b", "spec-gate-seed"]);
  git(projectDir, ["config", "user.email", "test@example.com"]);
  git(projectDir, ["config", "user.name", "test"]);
  writeFileSync(join(projectDir, "README.md"), "seed\n");
  git(projectDir, ["add", "README.md"]);
  git(projectDir, ["commit", "-q", "-m", "seed"]);
  git(projectDir, ["checkout", "-q", "-b", branch]);
  return projectDir;
}

function write(projectDir: string, relative: string, body: string) {
  const absolute = join(projectDir, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
  return absolute;
}

function run(
  projectDir: string,
  relative: string,
  toolName: "Write" | "Edit" = "Write",
) {
  const result = spawnSync("python3", [join(hooksDir, HOOK)], {
    input: JSON.stringify({
      tool_name: toolName,
      tool_input: {
        file_path: join(projectDir, relative),
        content: "",
      },
    }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    encoding: "utf8",
  });

  if (result.stderr.includes("can't open file")) {
    throw new Error(`${HOOK} 훅 스크립트가 아직 없다: ${result.stderr.trim()}`);
  }

  return result.status;
}

describe("spec 승인 게이트", () => {
  it("feat 브랜치에서 src/를 고치는데 대응 spec 파일이 아예 없으면 막는다", () => {
    const projectDir = createProject("feat/cart-price");

    expect(run(projectDir, "src/entities/cart/model/price.ts")).toBe(blocked);
  });

  it("spec 파일은 있지만 status 프론트매터가 없으면 막는다", () => {
    const projectDir = createProject("feat/cart-price");
    write(projectDir, "docs/2-design/spec/cart-price.md", NO_FRONTMATTER_SPEC);

    expect(run(projectDir, "src/entities/cart/model/price.ts")).toBe(blocked);
  });

  it("spec의 status가 approved가 아니면(draft 등) 막는다", () => {
    const projectDir = createProject("feat/cart-price");
    write(projectDir, "docs/2-design/spec/cart-price.md", DRAFT_SPEC);

    expect(run(projectDir, "src/entities/cart/model/price.ts")).toBe(blocked);
  });

  it("spec이 있고 status가 approved면 통과시킨다", () => {
    const projectDir = createProject("feat/cart-price");
    write(projectDir, "docs/2-design/spec/cart-price.md", APPROVED_SPEC);

    expect(run(projectDir, "src/entities/cart/model/price.ts")).toBe(allowed);
  });

  it.each(["main", "fix/foo", "docs/bar"])(
    "%s 브랜치는 spec 유무나 상태와 상관없이 항상 통과시킨다",
    (branch) => {
      const projectDir = createProject(branch);

      expect(run(projectDir, "src/entities/cart/model/price.ts")).toBe(allowed);
    },
  );

  it.each([
    "docs/2-design/spec/cart-price.md",
    "tests/lint/cart-price.test.ts",
    ".claude/settings.json",
  ])(
    "feat 브랜치라도 src/ 밖(%s) 수정에는 게이트가 적용되지 않는다",
    (relative) => {
      const projectDir = createProject("feat/cart-price");

      expect(run(projectDir, relative)).toBe(allowed);
    },
  );

  it("Write와 Edit 양쪽 툴에서 판정이 같다 — 막히는 경우", () => {
    const projectDir = createProject("feat/cart-price");

    expect(run(projectDir, "src/entities/cart/model/price.ts", "Write")).toBe(
      blocked,
    );
    expect(run(projectDir, "src/entities/cart/model/price.ts", "Edit")).toBe(
      blocked,
    );
  });

  it("Write와 Edit 양쪽 툴에서 판정이 같다 — 통과하는 경우", () => {
    const projectDir = createProject("feat/cart-price");
    write(projectDir, "docs/2-design/spec/cart-price.md", APPROVED_SPEC);

    expect(run(projectDir, "src/entities/cart/model/price.ts", "Write")).toBe(
      allowed,
    );
    expect(run(projectDir, "src/entities/cart/model/price.ts", "Edit")).toBe(
      allowed,
    );
  });

  it("슬러그는 feat/ 뒤 나머지 전체다 — 슬래시가 든 브랜치는 대응 spec이 있을 수 없어 막힌다", () => {
    const projectDir = createProject("feat/cart/price-fix");

    expect(run(projectDir, "src/entities/cart/model/price.ts")).toBe(blocked);
  });
});
