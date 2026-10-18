import { randomBytes, randomUUID } from "node:crypto";
import {
  newRunId,
  RUN_ID_ENV,
  testUserEmail,
} from "@tests/integration/testUserMark";

const registered = new Set<string>();

const trackedForThisTest = new Set<string>();

export function currentRunId(): string {
  const runId =
    process.env[RUN_ID_ENV] ??
    newRunId(new Date(), randomBytes(3).toString("hex"));
  process.env[RUN_ID_ENV] = runId;

  return runId;
}

export function newTestUserEmail(): string {
  return testUserEmail(currentRunId(), randomUUID());
}

export function registerTestUser(userId: string): void {
  registered.add(userId);
}

export function trackUser(userId: string): void {
  trackedForThisTest.add(userId);
}

export function takeTrackedUsers(): string[] {
  const userIds = [...trackedForThisTest];
  trackedForThisTest.clear();
  for (const userId of userIds) {
    registered.delete(userId);
  }

  return userIds;
}

export function takeRegisteredUsers(): string[] {
  const userIds = [...registered];
  registered.clear();

  return userIds;
}
