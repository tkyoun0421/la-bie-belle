import {
  PERMISSION_OF_OTHERS,
  REACHABLE,
} from "@/entities/notification/consts/notification.const";
import { getReachState } from "@/entities/notification/model/reachState.policy";

export type NotifyCandidate = {
  id: string;
  notifications_enabled: boolean;
  has_device: boolean;
};

export function canNotifyMember(
  members: readonly NotifyCandidate[],
  profileId: string,
): boolean {
  const found = members.find((one) => one.id === profileId);

  return (
    found !== undefined &&
    getReachState({
      notificationsEnabled: found.notifications_enabled,
      hasDevice: found.has_device,
      permission: PERMISSION_OF_OTHERS,
    }) === REACHABLE
  );
}
