import { execSql, queryColumn } from "@tests/integration/postgres";
import {
  type OrphanProfileRow,
  runEmailPattern,
  staleOrphanProfileIds,
} from "@tests/integration/testUserMark";
import {
  currentRunId,
  type PurgeTargets,
} from "@tests/integration/testUserRegistry";

export type ProfileReference = { table: string; column: string };

export const PROFILE_REFERENCES: readonly ProfileReference[] = [
  { table: "schedules", column: "created_by" },
  { table: "days", column: "opened_by" },
  { table: "slots", column: "ended_by" },
  { table: "assignments", column: "ended_by" },
  { table: "assignments", column: "profile_id" },
  { table: "position_grants", column: "granted_by" },
  { table: "requests", column: "requested_by" },
  { table: "cancel_requests", column: "decided_by" },
  { table: "check_ins", column: "profile_id" },
  { table: "excuses", column: "decided_by" },
  { table: "excuses", column: "profile_id" },
  { table: "adjustments", column: "adjusted_by" },
  { table: "adjustments", column: "profile_id" },
];

const MARKED_USERS =
  "select u.id from auth.users u where u.id = any(:'user_ids'::uuid[]) and u.email ~ :'email_pattern'";

const MARKED_PROFILES = `select p.id from public.profiles p where p.user_id in (${MARKED_USERS}) or (p.user_id is null and p.id = any(:'profile_ids'::uuid[]))`;

function purgeSql(): string {
  return [
    "begin;",
    ...PROFILE_REFERENCES.map(
      ({ table, column }) =>
        `delete from public.${table} where ${column} in (${MARKED_PROFILES});`,
    ),
    `delete from public.profiles where id in (${MARKED_PROFILES});`,
    `delete from auth.users where id in (${MARKED_USERS});`,
    "commit;",
  ].join("\n");
}

export function purgeTestUsers(
  { userIds, profileIds }: Readonly<PurgeTargets>,
  emailPattern: string = runEmailPattern(currentRunId()),
): void {
  if (userIds.length === 0 && profileIds.length === 0) {
    return;
  }

  execSql(`${purgeSql()}\n`, {
    user_ids: `{${userIds.join(",")}}`,
    profile_ids: `{${profileIds.join(",")}}`,
    email_pattern: emailPattern,
  });
}

const ORPHAN_PROFILES =
  "select p.id::text\n" +
  "  || '|' || floor(extract(epoch from p.created_at) * 1000)::bigint\n" +
  "  || '|' || (p.approved_at is not null)\n" +
  "  || '|' || (p.submitted_at is not null)\n" +
  "  || '|' || exists (select 1 from public.profile_private pp where pp.profile_id = p.id and pp.email is not null)\n" +
  "from public.profiles p\n" +
  "where p.user_id is null;\n";

function orphanProfileRows(): OrphanProfileRow[] {
  return queryColumn(ORPHAN_PROFILES).map((line) => {
    const [id, createdAtMs, approved, submitted, hasSubmittedEmail] =
      line.split("|");
    return {
      id,
      createdAtMs: Number(createdAtMs),
      approved: approved === "true",
      submitted: submitted === "true",
      hasSubmittedEmail: hasSubmittedEmail === "true",
    };
  });
}

export function staleOrphanTestProfileIds(now: Date): string[] {
  return staleOrphanProfileIds(orphanProfileRows(), now);
}
