import {
  REACH_LIST_SUFFIX,
  REACH_SHEET_LINE,
  UNREACHABLE_STATES,
} from "@/entities/notification/consts/notification.const";
import type { ReachState } from "@/entities/notification/model/reachState.policy";

function shows(reach: ReachState, active: boolean): boolean {
  return active && UNREACHABLE_STATES.has(reach);
}

export function getMemberListSuffix(
  reach: ReachState,
  active: boolean,
): string | null {
  return shows(reach, active) ? (REACH_LIST_SUFFIX[reach] ?? null) : null;
}

export function getMemberSheetLine(
  reach: ReachState,
  active: boolean,
): string | null {
  return shows(reach, active) ? (REACH_SHEET_LINE[reach] ?? null) : null;
}
