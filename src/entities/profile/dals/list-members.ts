import type { Db } from "@/shared/api/database";
import {
  filterBlockedMembers,
  filterPendingMembers,
  type MemberProfileRow,
} from "@/entities/profile/model/filter-members";
import {
  sortActiveMembers,
  sortLeftMembers,
} from "@/entities/profile/model/sort-members";

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

type EmbeddedMemberRow = Omit<MemberRow, "phone" | "birth_date" | "gender"> & {
  profile_private: {
    phone: string | null;
    birth_date: string | null;
    gender: string | null;
  } | null;
};

/** 개인정보가 표 하나 건너에 있는 것은 읽기 권한이 거기서 갈리기 때문이고, 화면이 알 일은 아니다. */
function flatten(rows: EmbeddedMemberRow[]): MemberRow[] {
  return rows.map(({ profile_private: contact, ...row }) => ({
    ...row,
    phone: contact?.phone ?? null,
    birth_date: contact?.birth_date ?? null,
    gender: contact?.gender ?? null,
  }));
}

export async function listPendingMembers(client: Db): Promise<MemberListRow[]> {
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

export async function listBlockedMembers(client: Db): Promise<MemberListRow[]> {
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
export async function listActiveMembers(client: Db): Promise<MemberRow[]> {
  const { data, error } = await client
    .from("profiles")
    .select(MEMBER_COLUMNS)
    .not("submitted_at", "is", null)
    .not("approved_at", "is", null)
    .is("left_at", null)
    .is("blocked_at", null)
    .is("rejected_at", null)
    .returns<EmbeddedMemberRow[]>();

  if (error) {
    throw error;
  }

  return sortActiveMembers(flatten(data ?? []));
}

/**
 * 그만둔 사람이다. 1년이 지나 비워진 사람도 이름과 퇴사한 날이 남아 여기 선다 — 시트가
 * 서는 것은 지난 근무표의 이름이 누구였는지 확인하는 자리라서다.
 */
export async function listLeftMembers(client: Db): Promise<MemberRow[]> {
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
