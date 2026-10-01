import type { DB } from "@/shared/api/database";
import {
  filterBlockedMembers,
  filterPendingMembers,
  type MemberProfileRow,
} from "@/entities/member/model/filterMembers";
import {
  sortActiveMembers,
  sortLeftMembers,
} from "@/entities/member/model/sortMembers";

/**
 * 관리자가 사람 목록 넷을 읽는 자리다 — 재직·퇴사·가입 대기·차단. 새 읽기 채널을 안 만든다 —
 * 관리자는 승인된 사람이라 `profiles`를 이미 전부 읽고, 여기서 하는 일은 그중 어느 행이
 * 목록인지를 정하는 것뿐이다(`docs/2-design/modules/account/design.md`의 「소유 데이터」).
 *
 * 서버에 조건과 순서를 같이 실어 보내고 받은 것을 `filter-members`로 한 번 더 거른다.
 * 쿼리는 네트워크를 아끼는 몫이고, 무엇이 목록인지를 아는 것은 그 함수 하나다.
 *
 * **직원 목록은 개인정보를 같이 싣는다.** 줄에 연락처가 서고 시트에 성별과 생년월일이 서는데
 * (`screens/members.md`), 줄을 누를 때마다 표 하나를 더 읽으면 시트가 빈 채로 먼저 뜬다.
 * 개인정보 표는 관리자에게 열려 있어([design.md](../../../../docs/2-design/modules/account/design.md#개인정보는-표를-가른다))
 * 같은 왕복에 담긴다. 가입 대기와 차단 목록은 그 값을 줄에 안 세워서 안 싣는다.
 *
 * **재직자 줄은 알림 갈래도 같이 싣는다.** 받겠다는 의사는 `profiles`에 있고 기기가 닿는지는
 * `push_reachable` 뷰에 있어 왕복이 둘이다 — 남의 주소 행을 읽는 길이 없어 존재 여부만 내는
 * 뷰가 따로 선다([notification/design.md](../../../../docs/2-design/modules/notification/design.md#알림을-받나)).
 * **퇴사 구획에는 안 붙는다** — 보낼 알림이 없어 갈래가 붙어도 관리자가 할 일이 없다.
 */

export type MemberListRow = MemberProfileRow & {
  photo_url: string | null;
};

export type MemberRow = MemberListRow & {
  role: string;
  left_at: string | null;
  erased_at: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
};

/** 재직자 줄에만 붙는 알림 갈래 둘이다 — 받겠다는 의사와 기기가 닿는지. */
export type ActiveMemberRow = MemberRow & {
  notifications_enabled: boolean;
  has_device: boolean;
};

const COLUMNS = [
  "id",
  "display_name",
  "photo_url",
  "submitted_at",
  "approved_at",
  "rejected_at",
  "blocked_at",
].join(", ");

const MEMBER_COLUMNS = [
  COLUMNS,
  "role",
  "left_at",
  "erased_at",
  "profile_private(phone, birth_date, gender)",
].join(", ");

const ACTIVE_COLUMNS = [MEMBER_COLUMNS, "notifications_enabled"].join(", ");

type Contact = {
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
};

type EmbeddedMemberRow = Omit<MemberRow, keyof Contact> & {
  profile_private: Contact | null;
};

type EmbeddedActiveRow = EmbeddedMemberRow & {
  notifications_enabled: boolean;
};

/** 개인정보가 표 하나 건너에 있는 것은 읽기 권한이 거기서 갈리기 때문이고, 화면이 알 일은 아니다. */
function flatten<Row extends EmbeddedMemberRow>(
  rows: readonly Row[],
): (Omit<Row, "profile_private"> & Contact)[] {
  return rows.map(({ profile_private: contact, ...row }) => ({
    ...row,
    phone: contact?.phone ?? null,
    birth_date: contact?.birth_date ?? null,
    gender: contact?.gender ?? null,
  }));
}

/**
 * 목록에 선 사람들의 기기가 닿는지다. 관리자가 아니면 뷰가 빈 결과를 내므로 아무에게도
 * 안 붙는다.
 *
 * **줄에 선 사람만 묻는다.** 이 뷰는 사람 수만큼 행을 내는데 PostgREST가 한 응답을
 * `max_rows`(`supabase/config.toml`)에서 자른다 — 조건 없이 읽으면 그 선을 넘은 사람이
 * 조용히 「기기 없음」으로 읽힌다. 재직자 목록은 이미 손에 있으니 그 id만 실어 보낸다.
 *
 * 같은 뷰를 [`notification`의 dal](../../notification/api/getPushReachable.api.ts)도 읽는다 —
 * 슬라이스끼리는 서로를 못 부르고(규칙 3) 목록이 갈래를 같이 내야 해서 읽는 손이 둘이다.
 * 뷰가 내는 열 둘이 정본이고 두 손은 그것을 각자 제 모양으로 받는다.
 */
async function readDevices(
  client: DB,
  profileIds: readonly string[],
): Promise<Map<string, boolean>> {
  if (profileIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("push_reachable")
    .select("profile_id, has_device")
    .in("profile_id", [...profileIds])
    .returns<{ profile_id: string | null; has_device: boolean | null }[]>();

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).flatMap((row) =>
      row.profile_id === null
        ? []
        : [[row.profile_id, row.has_device ?? false] as const],
    ),
  );
}

export async function listPendingMembers(client: DB): Promise<MemberListRow[]> {
  const { data, error } = await client
    .from("profiles")
    .select(COLUMNS)
    .not("submitted_at", "is", null)
    .is("approved_at", null)
    .is("rejected_at", null)
    .is("blocked_at", null)
    .order("submitted_at", { ascending: true })
    .returns<MemberListRow[]>();

  if (error) {
    throw error;
  }

  return filterPendingMembers(data ?? []);
}

export async function listBlockedMembers(client: DB): Promise<MemberListRow[]> {
  const { data, error } = await client
    .from("profiles")
    .select(COLUMNS)
    .not("blocked_at", "is", null)
    .order("blocked_at", { ascending: false })
    .returns<MemberListRow[]>();

  if (error) {
    throw error;
  }

  return filterBlockedMembers(data ?? []);
}

/**
 * 승인됐고 아직 그만두지 않은 사람이다. 차단·거절된 행은 승인 전에 갈라져 여기 안 온다.
 *
 * 프로필을 보낸 적 없는 행은 빠진다 — 이름도 사진도 없는 줄은 관리자가 다룰 사람이 아니다
 * ([ACC-001](../../../../docs/2-design/modules/account/README.md#acc-001)). `approve_member`를
 * 지난 사람은 다 보낸 사람이라, 이 조건에 걸리는 것은 손으로 넣은 첫 관리자뿐이다.
 */
export async function listActiveMembers(
  client: DB,
): Promise<ActiveMemberRow[]> {
  const { data, error } = await client
    .from("profiles")
    .select(ACTIVE_COLUMNS)
    .not("submitted_at", "is", null)
    .not("approved_at", "is", null)
    .is("left_at", null)
    .is("blocked_at", null)
    .is("rejected_at", null)
    .returns<EmbeddedActiveRow[]>();

  if (error) {
    throw error;
  }

  const rows = flatten(data ?? []);
  const devices = await readDevices(
    client,
    rows.map((row) => row.id),
  );

  return sortActiveMembers(
    rows.map((row) => ({
      ...row,
      has_device: devices.get(row.id) ?? false,
    })),
  );
}

/**
 * 그만둔 사람이다. 1년이 지나 비워진 사람도 이름과 퇴사한 날이 남아 여기 선다 — 시트가
 * 서는 것은 지난 근무표의 이름이 누구였는지 확인하는 자리라서다.
 */
export async function listLeftMembers(client: DB): Promise<MemberRow[]> {
  const { data, error } = await client
    .from("profiles")
    .select(MEMBER_COLUMNS)
    .not("submitted_at", "is", null)
    .not("left_at", "is", null)
    .returns<EmbeddedMemberRow[]>();

  if (error) {
    throw error;
  }

  return sortLeftMembers(flatten(data ?? []));
}
