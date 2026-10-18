import { readFileSync } from "node:fs";
import path from "node:path";

export type LocalProject = {
  projectId: string;
  dbPort: number;
};

export type ObservedDb = {
  hostPort: number | null;
  database: string;
};

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

const EXPECTED_DATABASE = "postgres";

const SECTION_HEADER = /^\[([^\]]+)\]$/;

function keyValueOf(line: string): [string, string] | null {
  const match = /^([A-Za-z0-9_]+)\s*=\s*(.+)$/.exec(line);
  return match ? [match[1], match[2].trim()] : null;
}

function unquoted(value: string): string {
  return value.replace(/^"(.*)"$/, "$1");
}

export function parseLocalProject(configToml: string): LocalProject {
  let section = "";
  let projectId: string | undefined;
  let dbPort: number | undefined;

  for (const raw of configToml.split("\n")) {
    const line = raw.trim();
    const header = SECTION_HEADER.exec(line);
    if (header) {
      section = header[1];
      continue;
    }

    const entry = keyValueOf(line);
    if (!entry) {
      continue;
    }

    const [key, value] = entry;
    if (section === "" && key === "project_id") {
      projectId = unquoted(value);
    }
    if (section === "db" && key === "port") {
      dbPort = Number(value);
    }
  }

  if (!projectId) {
    throw new Error("supabase/config.toml 맨 위에 project_id 가 없다.");
  }
  if (dbPort === undefined || !Number.isInteger(dbPort)) {
    throw new Error("supabase/config.toml 의 [db] 에 port 가 없다.");
  }

  return { projectId, dbPort };
}

export function readLocalProject(): LocalProject {
  return parseLocalProject(
    readFileSync(path.join(process.cwd(), "supabase/config.toml"), "utf8"),
  );
}

export function dbContainerOf(project: LocalProject): string {
  return `supabase_db_${project.projectId}`;
}

export function isLoopbackUrl(url: string | undefined): boolean {
  if (url === undefined || !URL.canParse(url)) {
    return false;
  }

  return LOOPBACK_HOSTS.has(new URL(url).hostname);
}

export function remoteUrlProblems(
  urls: Record<string, string | undefined>,
): string[] {
  return Object.entries(urls)
    .filter(
      (entry): entry is [string, string] =>
        entry[1] !== undefined && !isLoopbackUrl(entry[1]),
    )
    .map(
      ([name, url]) =>
        `${name} 이 "${url}" 다 — 로컬(127.0.0.1·localhost·::1)이 아니다.`,
    );
}

export function hostPortOf(dockerPortOutput: string): number | null {
  const match = /:(\d+)\s*$/m.exec(dockerPortOutput.trim());
  return match ? Number(match[1]) : null;
}

export function dbTargetProblems(
  project: LocalProject,
  observed: ObservedDb,
): string[] {
  const container = dbContainerOf(project);
  const problems: string[] = [];

  if (observed.hostPort !== project.dbPort) {
    problems.push(
      `${container} 가 호스트 포트 ${observed.hostPort ?? "없음"} 에 열려 있다 — config.toml 의 [db] port 는 ${project.dbPort} 다.`,
    );
  }
  if (observed.database !== EXPECTED_DATABASE) {
    problems.push(
      `${container} 에서 붙은 데이터베이스가 "${observed.database}" 다 — "${EXPECTED_DATABASE}" 여야 한다.`,
    );
  }

  return problems;
}

export function throwIfProblems(problems: readonly string[]): void {
  if (problems.length === 0) {
    return;
  }

  throw new Error(
    [
      "integration 대상이 로컬 Supabase 가 아니다. 시작하지 않는다.",
      ...problems.map((problem) => `- ${problem}`),
    ].join("\n"),
  );
}
