import { purgeTestUsers } from "@tests/integration/cleanup";
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

const batches = stalePurgeBatches(candidateUsers(), new Date());

for (const { emailPattern, userIds } of batches) {
  purgeTestUsers({ userIds, profileIds: [] }, emailPattern);
  console.log(`${userIds.length}명 지움 — ${emailPattern}`);
}

console.log(
  batches.length === 0
    ? "치울 테스트 사용자가 없다."
    : `회차 ${batches.length}묶음을 치웠다.`,
);
