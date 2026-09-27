// e2e가 세션을 심으려면 「그 상태인 사람」이 DB에 먼저 있어야 한다. 그 사람을 만들어 토큰을
// 돌려주는 로컬 서버다.
//
//   POST http://127.0.0.1:8765/seed  {"state": "rejected"}
//   → {"access_token": "…", "refresh_token": "…", "user_id": "…", "profile": {…}}
//
// 상태는 여덟이다 — fresh · submitted · approved · admin · rejected · left · blocked ·
// read_failure. `name`은 선택이고, 프로필을 보내는 상태에서 그 사람의 이름을 고른다
// (안 주면 SEEDED_PROFILE의 이름이다).
// 부르는 쪽은 `tests/e2e/scripts/seed-session.js`고, 받은 토큰을 개발 빌드의 테스트 문
// (`src/app/__test/session.tsx`)에 딥링크로 싣는다. 정본은 `docs/4-test/execution.md`의
// 「`pnpm e2e`」 절이다.
//
// 사람을 만드는 손은 integration 테스트가 쓰는 것을 그대로 쓴다 — 같은 상태를 두 군데서
// 다르게 만들면 e2e가 본 상태와 integration이 본 상태가 갈린다.
//
// **프로덕션에는 절대 안 붙는다.** 앱이 보는 Supabase가 로컬이 아니면 뜨기 전에 죽는다.
// 이 서버는 사용자를 만들고 관리자 권한을 올리는 일을 하므로 겨눈 곳이 어디인지가 전부다.

import { createServer, type IncomingMessage, type Server } from "node:http";
import { createAdminUser } from "@tests/integration/postgres";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

export const SEED_PORT = 8765;

const SEED_HOST = "127.0.0.1";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

const READ_FAILURE = "read_failure";

/**
 * 프로필을 보낸 사람의 다섯은 고정값이다. `tests/e2e/pending.yaml`이 거절된 사람의 굳은
 * 글에, `tests/e2e/profile.yaml`이 승인된 사람의 「나」 화면에 이 값이 그대로 서는지
 * 단언한다 — 사람 이름과 번호는 전부 가짜다.
 *
 * **이름만 부르는 쪽이 고를 수 있다.** 한 화면에 승인된 사람을 여럿 세우는 플로우
 * (`tests/e2e/members.yaml`)가 검색이 한 줄만 남기는지 보려면 이름이 갈려야 한다. 번호와
 * 생년월일은 그대로 둔다 — ACC-005가 같은 번호 둘을 안 막는다.
 */
const SEEDED_PROFILE = {
  name: "박서연",
  gender: "male",
  birthDate: "1990-11-05",
  phone: "010-0000-0002",
};

const STATES = [
  "fresh",
  "submitted",
  "approved",
  "admin",
  "rejected",
  "left",
  "blocked",
  READ_FAILURE,
] as const;

export type SeedState = (typeof STATES)[number];

type SeedResponse = {
  access_token: string;
  refresh_token: string;
  user_id: string;
  profile: typeof SEEDED_PROFILE | null;
  simulate?: string;
};

function assertLocalTarget(): void {
  const target = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const host = URL.canParse(target) ? new URL(target).hostname : "";

  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `시드 서버는 로컬에서만 돈다. EXPO_PUBLIC_SUPABASE_URL 이 "${target}" 다 — ` +
        "`supabase status -o env` 의 API_URL 을 넣고 다시 돌려라.",
    );
  }
}

async function tokensOf(user: SignedInUser): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const { data, error } = await user.client.auth.getSession();

  if (error || !data.session) {
    throw error ?? new Error("가입은 됐는데 세션 토큰이 없다");
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

async function submitSeededProfile(
  user: SignedInUser,
  profile: typeof SEEDED_PROFILE,
): Promise<void> {
  const { error } = await user.client.rpc("submit_profile", {
    display_name: profile.name,
    phone: profile.phone,
    birth_date: profile.birthDate,
    gender: profile.gender,
  });

  if (error) {
    throw error;
  }
}

/**
 * 관리자 판정 하나를 대상에게 내린다. 화면이 부르는 것과 같은 함수를 부른다 — SQL로
 * 열을 직접 채우면 e2e가 본 상태와 함수가 만드는 상태가 갈린다.
 */
async function decideBy(
  decision: "approve_member" | "reject_member" | "block_member" | "mark_leave",
  profileId: string,
): Promise<void> {
  const admin = await createAdminUser();
  const { error } = await admin.client.rpc(decision, { profile_id: profileId });

  if (error) {
    throw error;
  }
}

async function seededUser(
  state: SeedState,
  name: string,
): Promise<{ user: SignedInUser; profile: typeof SEEDED_PROFILE | null }> {
  if (state === "admin") {
    return { user: await createAdminUser(), profile: null };
  }

  const user = await createSignedInUser();

  if (state === "fresh" || state === READ_FAILURE) {
    return { user, profile: null };
  }

  const profile = { ...SEEDED_PROFILE, name };

  await submitSeededProfile(user, profile);

  // 승인된 사람은 「나」 화면에서 자기 다섯을 본다(tests/e2e/profile.yaml). 열을 SQL로
  // 직접 채우는 createApprovedUser로는 개인정보 행이 안 생겨 그 화면이 빈 줄로 선다 —
  // 신청자를 만들어 관리자가 받는 실제 경로를 그대로 밟는다.
  if (state === "approved") {
    await decideBy("approve_member", user.profileId);
  }

  if (state === "rejected") {
    await decideBy("reject_member", user.profileId);
  }

  // 차단은 「제출됨」 사람만 대상이라(design.md 「가입 승인·거절·차단·해제」) 프로필을 먼저
  // 보낸 뒤 차단한다. 차단한 사람 목록이 이름 있는 줄을 보여줘야 하는 것도 같은 이유다.
  if (state === "blocked") {
    await decideBy("block_member", user.profileId);
  }

  // 퇴사도 승인된 사람만 대상이라 받고 나서 내보낸다. 직원 화면의 퇴사 구획이 이름 있는
  // 줄을 보여줘야 해서(tests/e2e/members.yaml) 프로필을 먼저 보낸다.
  if (state === "left") {
    await decideBy("approve_member", user.profileId);
    await decideBy("mark_leave", user.profileId);
  }

  return { user, profile };
}

export async function seed(
  state: SeedState,
  name: string = SEEDED_PROFILE.name,
): Promise<SeedResponse> {
  const { user, profile } = await seededUser(state, name);

  return {
    ...(await tokensOf(user)),
    user_id: user.userId,
    profile,
    ...(state === READ_FAILURE ? { simulate: READ_FAILURE } : {}),
  };
}

function isSeedState(value: unknown): value is SeedState {
  return STATES.includes(value as SeedState);
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export function startSeedServer(): Promise<Server> {
  assertLocalTarget();

  const server = createServer((request, response) => {
    void (async () => {
      if (request.method !== "POST" || request.url !== "/seed") {
        response.writeHead(404).end();
        return;
      }

      try {
        const { state, name } = JSON.parse(await readBody(request)) as {
          state?: unknown;
          name?: unknown;
        };

        if (!isSeedState(state)) {
          response
            .writeHead(400, { "Content-Type": "application/json" })
            .end(JSON.stringify({ error: `모르는 상태다: ${String(state)}` }));
          return;
        }

        const chosen =
          typeof name === "string" && name !== "" ? name : undefined;

        response
          .writeHead(200, { "Content-Type": "application/json" })
          .end(JSON.stringify(await seed(state, chosen)));
      } catch (error) {
        response
          .writeHead(500, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: String(error) }));
      }
    })();
  });

  return new Promise((resolve) => {
    server.listen(SEED_PORT, SEED_HOST, () => resolve(server));
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const server = await startSeedServer();

  console.warn(`시드 서버: http://${SEED_HOST}:${SEED_PORT}/seed`);

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
