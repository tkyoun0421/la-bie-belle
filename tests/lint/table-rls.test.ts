import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  repositoryTableRlsViolations,
  tableRlsViolations,
} from "@tests/lint/table-rls";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "table-rls-"));
}

function write(root: string, relative: string, body: string) {
  const absolute = join(root, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
}

describe("표 선언마다 RLS 활성화가 있는지 본다", () => {
  it("표를 만들고 바로 RLS를 켜면 위반이 없다", () => {
    const sql = `
      create table public.halls (
        id uuid primary key default gen_random_uuid()
      );

      alter table public.halls enable row level security;
    `;

    expect(tableRlsViolations(sql)).toEqual([]);
  });

  it("표를 만들고 RLS를 안 켜면 위반이다", () => {
    const sql = `
      create table public.halls (
        id uuid primary key default gen_random_uuid()
      );
    `;

    expect(tableRlsViolations(sql)).toEqual([{ table: "halls" }]);
  });

  it("여러 표 중 하나만 RLS가 빠지면 그 표만 위반이다", () => {
    const sql = `
      create table public.halls (id uuid primary key);
      create table public.days (id uuid primary key);

      alter table public.halls enable row level security;
    `;

    expect(tableRlsViolations(sql)).toEqual([{ table: "days" }]);
  });

  it("public이 아닌 스키마의 표는 대상이 아니다", () => {
    const sql = `
      create table internal.secrets (id uuid primary key);
    `;

    expect(tableRlsViolations(sql)).toEqual([]);
  });

  it("-- 줄 주석 안의 create table 문장은 표로 안 본다", () => {
    const sql = `
      -- create table public.ghost (id uuid primary key);
      create table public.halls (id uuid primary key);
      alter table public.halls enable row level security;
    `;

    expect(tableRlsViolations(sql)).toEqual([]);
  });

  it("표 선언과 RLS 활성화가 문자열의 다른 조각에 있어도 합쳐서 보면 위반이 아니다", () => {
    const declaration = "create table public.halls (id uuid primary key);";
    const enabling = "alter table public.halls enable row level security;";

    expect(tableRlsViolations(`${declaration}\n${enabling}`)).toEqual([]);
  });
});

describe("표 RLS 대조 — 임시 디렉터리로 여러 마이그레이션 파일을 합친다", () => {
  it("RLS 활성화가 표를 선언한 파일과 다른 파일에 있어도 위반이 아니다", () => {
    const root = tempRoot();
    write(
      root,
      "supabase/migrations/20260101000000_a.sql",
      "create table public.halls (id uuid primary key);\n",
    );
    write(
      root,
      "supabase/migrations/20260201000000_b.sql",
      "alter table public.halls enable row level security;\n",
    );

    expect(repositoryTableRlsViolations(root)).toEqual([]);
  });

  it("어느 파일에도 RLS 활성화가 없으면 위반이다", () => {
    const root = tempRoot();
    write(
      root,
      "supabase/migrations/20260101000000_a.sql",
      "create table public.halls (id uuid primary key);\n",
    );
    write(
      root,
      "supabase/migrations/20260201000000_b.sql",
      "create table public.days (id uuid primary key);\n",
    );

    expect(repositoryTableRlsViolations(root)).toEqual([{ table: "days" }]);
  });
});

describe("표 RLS 대조 — 실제 저장소 회귀", () => {
  it("현재 저장소의 모든 표가 RLS를 켰다 (회귀)", () => {
    expect(repositoryTableRlsViolations(process.cwd())).toEqual([]);
  });
});
