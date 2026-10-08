import type { ActiveMember } from "@/entities/member/model/member.type";
import {
  PERMISSION_OF_OTHERS,
  REACHABLE,
} from "@/entities/notification/consts/notification.const";
import { getReachState } from "@/entities/notification/model/reachState.policy";

export type NotifyCandidate = Pick<
  ActiveMember,
  "id" | "notificationsEnabled" | "hasDevice"
>;

export function canNotifyMember(
  members: readonly NotifyCandidate[],
  profileId: string,
): boolean {
  const found = members.find((one) => one.id === profileId);

  return (
    found !== undefined &&
    getReachState({
      notificationsEnabled: found.notificationsEnabled,
      hasDevice: found.hasDevice,
      permission: PERMISSION_OF_OTHERS,
    }) === REACHABLE
  );
}
