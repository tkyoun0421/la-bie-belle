import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const hooksDir = fileURLToPath(new URL("../", import.meta.url));

let projectDir: string;

function write(relative: string, body: string) {
  const absolute = join(projectDir, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
  return absolute;
}

function run(hook: string, relative: string, content: string) {
  const result = spawnSync("python3", [join(hooksDir, hook)], {
    input: JSON.stringify({
      tool_name: "Write",
      tool_input: { file_path: join(projectDir, relative), content },
    }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    encoding: "utf8",
  });
  return result.status;
}

const blocked = 2;
const allowed = 0;

beforeAll(() => {
  projectDir = mkdtempSync(join(tmpdir(), "tdd-guard-"));
  write("tests/e2e/home.spec.ts", "");
  write("src/shared/lib/utils.ts", "export function cn() {}");
  write("src/shared/lib/__tests__/utils.test.ts", "");
  write("src/screens/orders/__tests__/placeholder", "");
  write("tests/e2e/orders.spec.ts", "");
});

describe("유닛 훅", () => {
  it("실행 코드를 내보내는데 짝 테스트가 없으면 막는다", () => {
    expect(
      run("tdd-guard-unit.py", "src/entities/cart/models/cart.ts", "export function total() {}"),
    ).toBe(blocked);
  });

  it("화살표 함수를 내보내도 막는다", () => {
    expect(
      run("tdd-guard-unit.py", "src/features/add/hooks/useAdd.ts", "export const useAdd = () => {}"),
    ).toBe(blocked);
  });

  it("타입만 있으면 통과시킨다", () => {
    expect(
      run("tdd-guard-unit.py", "src/entities/cart/types.ts", "export type Cart = { id: string }"),
    ).toBe(allowed);
  });

  it("상수만 있으면 통과시킨다", () => {
    expect(
      run("tdd-guard-unit.py", "src/entities/cart/config/consts.ts", "export const MAX = 10"),
    ).toBe(allowed);
  });

  it("짝 테스트가 있으면 통과시킨다", () => {
    expect(
      run("tdd-guard-unit.py", "src/shared/lib/utils.ts", "export function cn() {}"),
    ).toBe(allowed);
  });

  it("더미 UI인 tsx는 보지 않는다", () => {
    expect(
      run("tdd-guard-unit.py", "src/features/add/ui/Button.tsx", "export function Button() {}"),
    ).toBe(allowed);
  });

  it("테스트 파일 자체는 보지 않는다", () => {
    expect(
      run("tdd-guard-unit.py", "src/entities/cart/models/__tests__/cart.test.ts", "export function x() {}"),
    ).toBe(allowed);
  });

  it("라우팅 레이어와 shadcn 생성물은 보지 않는다", () => {
    expect(
      run("tdd-guard-unit.py", "src/app/api/cart/route.ts", "export function GET() {}"),
    ).toBe(allowed);
    expect(
      run("tdd-guard-unit.py", "src/shared/ui/button.ts", "export function buttonVariants() {}"),
    ).toBe(allowed);
  });
});

describe("e2e 훅", () => {
  it("새 라우트에 spec이 없으면 막는다", () => {
    expect(run("tdd-guard-e2e.py", "src/app/cart/page.tsx", "")).toBe(blocked);
  });

  it("screens 슬라이스에 spec이 없으면 막는다", () => {
    expect(run("tdd-guard-e2e.py", "src/screens/cart/ui/CartScreen.tsx", "")).toBe(blocked);
  });

  it("루트 화면은 home spec으로 짝을 찾는다", () => {
    expect(run("tdd-guard-e2e.py", "src/app/page.tsx", "")).toBe(allowed);
    expect(run("tdd-guard-e2e.py", "src/app/layout.tsx", "")).toBe(allowed);
  });

  it("짝 spec이 있는 슬라이스는 통과시킨다", () => {
    expect(run("tdd-guard-e2e.py", "src/screens/orders/ui/OrdersScreen.tsx", "")).toBe(allowed);
  });

  it("화면이 아닌 파일은 보지 않는다", () => {
    expect(run("tdd-guard-e2e.py", "src/shared/ui/button.tsx", "")).toBe(allowed);
    expect(run("tdd-guard-e2e.py", "src/entities/cart/models/cart.ts", "")).toBe(allowed);
  });
});
