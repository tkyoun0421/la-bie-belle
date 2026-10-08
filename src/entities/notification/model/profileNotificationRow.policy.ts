import {
  PUSH_DENIED_SUBLINE,
  PUSH_DENIED_TITLE,
} from "@/entities/notification/consts/notification.const";
import type { ReachState } from "@/entities/notification/model/reachState.policy";

export type ProfileNotificationRow =
  | {
      kind: "switch";
      state: "on" | "off" | "locked";
      title?: undefined;
      subline?: undefined;
    }
  | {
      kind: "notice";
      state?: undefined;
      title: string;
      subline: string;
    };

export function getProfileNotificationRow(
  reach: ReachState,
  isPending: boolean,
): ProfileNotificationRow {
  if (reach === "denied") {
    return {
      kind: "notice",
      title: PUSH_DENIED_TITLE,
      subline: PUSH_DENIED_SUBLINE,
    };
  }

  if (reach === "loading" || isPending) {
    return { kind: "switch", state: "locked" };
  }

  return { kind: "switch", state: reach === "off" ? "off" : "on" };
}
