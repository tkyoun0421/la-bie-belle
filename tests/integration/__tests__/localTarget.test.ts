import { readFileSync } from "node:fs";
import path from "node:path";
import {
  dbContainerOf,
  dbTargetProblems,
  hostPortOf,
  isLoopbackUrl,
  parseLocalProject,
  remoteUrlProblems,
  throwIfProblems,
} from "@tests/integration/localTarget";

const PROJECT = { projectId: "la-bie-belle", dbPort: 54322 };

describe("로컬 프로젝트 읽기", () => {
  it("저장소의 config.toml에서 project_id와 [db] 포트를 읽는다", () => {
    const toml = readFileSync(
      path.join(process.cwd(), "supabase/config.toml"),
      "utf8",
    );

    expect(parseLocalProject(toml)).toEqual(PROJECT);
  });

  it("[api] 포트가 아니라 [db] 포트를 고른다", () => {
    const toml = [
      'project_id = "demo"',
      "[api]",
      "port = 1111",
      "[db]",
      "# port = 3333",
      "port = 2222",
      "shadow_port = 4444",
      "[studio]",
      "port = 5555",
    ].join("\n");

    expect(parseLocalProject(toml)).toEqual({
      projectId: "demo",
      dbPort: 2222,
    });
  });

  it("섹션 안이나 주석 처리된 project_id는 안 본다", () => {
    const toml = [
      '# project_id = "commented"',
      'project_id = "top"',
      "[db]",
      "port = 2222",
      "[auth.third_party.firebase]",
      'project_id = "nested"',
    ].join("\n");

    expect(parseLocalProject(toml).projectId).toBe("top");
  });

  it("project_id가 없으면 이유를 말하고 던진다", () => {
    expect(() => parseLocalProject("[db]\nport = 2222\n")).toThrow(
      /project_id/,
    );
  });

  it("[db] 포트가 없으면 이유를 말하고 던진다", () => {
    expect(() => parseLocalProject('project_id = "demo"\n[db]\n')).toThrow(
      /\[db\]/,
    );
  });
});

describe("DB 컨테이너 이름", () => {
  it("supabase CLI가 짓는 supabase_db_<project_id> 꼴이다", () => {
    expect(dbContainerOf(PROJECT)).toBe("supabase_db_la-bie-belle");
  });
});

describe("loopback 판정", () => {
  it.each([
    "http://127.0.0.1:54321",
    "http://localhost:54321",
    "http://[::1]:54321",
    "https://localhost",
  ])("%s 는 로컬이다", (url) => {
    expect(isLoopbackUrl(url)).toBe(true);
  });

  it.each([
    "https://abcdefgh.supabase.co",
    "http://192.168.0.10:54321",
    "http://127.0.0.1.example.com:54321",
    "http://localhost.example.com",
    "127.0.0.1:54321",
    "not a url",
    "",
  ])("%s 는 로컬이 아니다", (url) => {
    expect(isLoopbackUrl(url)).toBe(false);
  });

  it("값이 없으면 로컬이 아니다", () => {
    expect(isLoopbackUrl(undefined)).toBe(false);
  });
});

describe("원격을 가리키는 URL", () => {
  it("모두 로컬이면 문제가 없다", () => {
    expect(
      remoteUrlProblems({
        API_URL: "http://127.0.0.1:54321",
        EXPO_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      }),
    ).toEqual([]);
  });

  it("값이 없는 이름은 건너뛴다", () => {
    expect(
      remoteUrlProblems({
        API_URL: "http://127.0.0.1:54321",
        EXPO_PUBLIC_SUPABASE_URL: undefined,
      }),
    ).toEqual([]);
  });

  it("원격인 이름마다 이름과 값을 든 문제를 하나씩 낸다", () => {
    const problems = remoteUrlProblems({
      API_URL: "https://abcdefgh.supabase.co",
      EXPO_PUBLIC_SUPABASE_URL: "https://ijklmnop.supabase.co",
    });

    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain("API_URL");
    expect(problems[0]).toContain("https://abcdefgh.supabase.co");
    expect(problems[1]).toContain("EXPO_PUBLIC_SUPABASE_URL");
    expect(problems[1]).toContain("https://ijklmnop.supabase.co");
  });
});

describe("docker port 출력에서 호스트 포트 읽기", () => {
  it("IPv4와 IPv6 줄이 같이 와도 포트를 읽는다", () => {
    expect(hostPortOf("0.0.0.0:54322\n[::]:54322\n")).toBe(54322);
  });

  it("매핑이 없으면 null이다", () => {
    expect(hostPortOf("")).toBeNull();
  });
});

describe("붙은 DB가 config.toml의 DB인지", () => {
  it("포트와 데이터베이스가 맞으면 문제가 없다", () => {
    expect(
      dbTargetProblems(PROJECT, { hostPort: 54322, database: "postgres" }),
    ).toEqual([]);
  });

  it("호스트 포트가 다르면 두 포트를 든 문제를 낸다", () => {
    const problems = dbTargetProblems(PROJECT, {
      hostPort: 64322,
      database: "postgres",
    });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("64322");
    expect(problems[0]).toContain("54322");
  });

  it("호스트 포트를 못 읽었으면 문제를 낸다", () => {
    expect(
      dbTargetProblems(PROJECT, { hostPort: null, database: "postgres" }),
    ).toHaveLength(1);
  });

  it("데이터베이스가 postgres가 아니면 그 이름을 든 문제를 낸다", () => {
    const problems = dbTargetProblems(PROJECT, {
      hostPort: 54322,
      database: "other_db",
    });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("other_db");
  });
});

describe("문제가 있으면 죽는다", () => {
  it("문제가 없으면 던지지 않는다", () => {
    expect(() => throwIfProblems([])).not.toThrow();
  });

  it("문제를 전부 담아 던진다", () => {
    expect(() => throwIfProblems(["첫째 문제", "둘째 문제"])).toThrow(
      /첫째 문제[\s\S]*둘째 문제/,
    );
  });
});
