import { randomBytes, randomUUID } from "node:crypto";
import {
  newRunId,
  RUN_ID_ENV,
  testUserEmail,
} from "@tests/integration/testUserMark";

export type PurgeTargets = { userIds: string[]; profileIds: string[] };

const profileOfRegisteredUser = new Map<string, string | null>();

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
  if (!profileOfRegisteredUser.has(userId)) {
    profileOfRegisteredUser.set(userId, null);
  }
}

export function registerTestProfile(userId: string, profileId: string): void {
  profileOfRegisteredUser.set(userId, profileId);
}

export function trackUser(userId: string): void {
  trackedForThisTest.add(userId);
}

function takeUsers(userIds: readonly string[]): PurgeTargets {
  const profileIds: string[] = [];
  for (const userId of userIds) {
    const profileId = profileOfRegisteredUser.get(userId);
    if (profileId) {
      profileIds.push(profileId);
    }
    profileOfRegisteredUser.delete(userId);
  }

  return { userIds: [...userIds], profileIds };
}

export function takeTracked(): PurgeTargets {
  const userIds = [...trackedForThisTest];
  trackedForThisTest.clear();

  return takeUsers(userIds);
}

export function takeRegistered(): PurgeTargets {
  return takeUsers([...profileOfRegisteredUser.keys()]);
}
