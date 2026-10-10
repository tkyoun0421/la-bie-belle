import type { DB } from "@/shared/api/database";
import type {
  ActiveMemberRow,
  MemberRow,
  MemberSummaryRow,
  PushReachableRow,
} from "@/entities/member/api/member.dto";
import type {
  ActiveMember,
  Member,
  MemberSummary,
} from "@/entities/member/model/member.type";
import {
  sortActiveMembers,
  sortLeftMembers,
} from "@/entities/member/model/sortMembers.policy";
import {
  filterBlockedMembers,
  filterPendingMembers,
} from "@/entities/member/utils/filterMembers.utils";
import {
  toActiveMember,
  toMember,
  toMemberSummary,
} from "@/entities/member/utils/member.mapper";

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
    .returns<PushReachableRow[]>();

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((row) => [row.profile_id, row.has_device] as const),
  );
}

export async function listPendingMembers(client: DB): Promise<MemberSummary[]> {
  const { data, error } = await client
    .from("profiles")
    .select(COLUMNS)
    .not("submitted_at", "is", null)
    .is("approved_at", null)
    .is("rejected_at", null)
    .is("blocked_at", null)
    .order("submitted_at", { ascending: true })
    .returns<MemberSummaryRow[]>();

  if (error) {
    throw error;
  }

  return filterPendingMembers((data ?? []).map(toMemberSummary));
}

export async function listBlockedMembers(client: DB): Promise<MemberSummary[]> {
  const { data, error } = await client
    .from("profiles")
    .select(COLUMNS)
    .not("blocked_at", "is", null)
    .order("blocked_at", { ascending: false })
    .returns<MemberSummaryRow[]>();

  if (error) {
    throw error;
  }

  return filterBlockedMembers((data ?? []).map(toMemberSummary));
}

export async function listActiveMembers(client: DB): Promise<ActiveMember[]> {
  const { data, error } = await client
    .from("profiles")
    .select(ACTIVE_COLUMNS)
    .not("submitted_at", "is", null)
    .not("approved_at", "is", null)
    .is("left_at", null)
    .is("blocked_at", null)
    .is("rejected_at", null)
    .returns<ActiveMemberRow[]>();

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const devices = await readDevices(
    client,
    rows.map((row) => row.id),
  );

  return sortActiveMembers(
    rows.map((row) => toActiveMember(row, devices.get(row.id) ?? false)),
  );
}

export async function listLeftMembers(client: DB): Promise<Member[]> {
  const { data, error } = await client
    .from("profiles")
    .select(MEMBER_COLUMNS)
    .not("submitted_at", "is", null)
    .not("left_at", "is", null)
    .returns<MemberRow[]>();

  if (error) {
    throw error;
  }

  return sortLeftMembers((data ?? []).map(toMember));
}
