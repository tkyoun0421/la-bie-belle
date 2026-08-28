import { spawnSync } from "node:child_process";

function authContainerName(): string {
  const result = spawnSync(
    "docker",
    ["ps", "--filter", "name=supabase_auth", "--format", "{{.Names}}"],
    { encoding: "utf8" },
  );
  const name = result.stdout.trim().split("\n")[0];
  if (!name) {
    throw new Error(
      "supabase_auth 컨테이너를 못 찾았다. 로컬 Supabase가 떠 있는지 확인해라.",
    );
  }
  return name;
}

export function countGetUserCalls(): number {
  const container = authContainerName();
  const result = spawnSync("docker", ["logs", container], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });
  const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  return combined
    .split("\n")
    .filter(
      (line) =>
        line.includes('"path":"/user"') && line.includes('"method":"GET"'),
    ).length;
}
