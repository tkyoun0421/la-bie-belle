import type { Db } from "@/shared/api/database";
import {
  filterBlockedMembers,
  filterPendingMembers,
  type MemberProfileRow,
} from "@/entities/profile/model/filter-members";

/**
 * 관리자가 가입 대기와 차단한 사람을 읽는 자리다. 새 읽기 채널을 안 만든다 — 관리자는
 * 승인된 사람이라 `profiles`를 이미 전부 읽고, 여기서 하는 일은 그중 어느 행이 목록인지를
 * 정하는 것뿐이다(`docs/2-design/modules/account/design.md`의 「소유 데이터」).
 *
 * 서버에 조건과 순서를 같이 실어 보내고 받은 것을 `filter-members`로 한 번 더 거른다.
 * 쿼리는 네트워크를 아끼는 몫이고, 무엇이 목록인지를 아는 것은 그 함수 하나다.
 */

export type MemberListRow = MemberProfileRow & {
  photo_url: string | null;
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
