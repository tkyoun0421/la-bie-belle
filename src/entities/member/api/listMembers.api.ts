import type { DB } from "@/shared/api/database";
import type {
  ActiveMemberRow,
  MemberListRow,
  MemberRow,
} from "@/entities/member/api/member.dto";
import {
  sortActiveMembers,
  sortLeftMembers,
} from "@/entities/member/model/sortMembers.policy";
import {
  filterBlockedMembers,
  filterPendingMembers,
} from "@/entities/member/utils/filterMembers.utils";

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
