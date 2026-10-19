import {
  purgeTestUsers,
  staleOrphanTestProfileIds,
} from "@tests/integration/cleanup";
import { queryColumn } from "@tests/integration/postgres";
import {
  stalePurgeBatches,
  type TestUserRow,
} from "@tests/integration/testUserMark";

function candidateUsers(): TestUserRow[] {
  return queryColumn(
    "select id::text || '|' || email || '|' || floor(extract(epoch from created_at) * 1000)::bigint\n" +
      "from auth.users\n" +
      "where email like 'test+%@example.test' or email like '%@example.com';\n",
  ).map((row) => {
    const [id, email, createdAtMs] = row.split("|");
    return { id, email, createdAtMs: Number(createdAtMs) };
  });
}

const now = new Date();
const batches = stalePurgeBatches(candidateUsers(), now);

for (const { emailPattern, userIds } of batches) {
  purgeTestUsers({ userIds, profileIds: [] }, emailPattern);
  console.log(`${userIds.length}명 지움 — ${emailPattern}`);
}

console.log(
  batches.length === 0
    ? "치울 테스트 사용자가 없다."
    : `회차 ${batches.length}묶음을 치웠다.`,
);

const orphanProfileIds = staleOrphanTestProfileIds(now);

if (orphanProfileIds.length > 0) {
  purgeTestUsers({ userIds: [], profileIds: orphanProfileIds });
}

console.log(
  orphanProfileIds.length === 0
    ? "치울 user_id 빈 테스트 profile이 없다."
    : `user_id 빈 테스트 profile ${orphanProfileIds.length}행을 치웠다.`,
);
