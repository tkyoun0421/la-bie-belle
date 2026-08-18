import { HOME_BLOCK_NAMES } from "@/views/home/model/home-view-model";
import type { HomeBlockName, HomeViewModel } from "@/views/home/model/home-view-model";

type HomeBlockStatus = "filled" | "empty" | "hidden" | "failed" | "loading";

export type HomeBlockPlan = ReadonlyArray<{
  block: HomeBlockName;
  status: Exclude<HomeBlockStatus, "hidden">;
}>;

function noticesStatus(block: HomeViewModel["notices"]): HomeBlockStatus {
  if (block.state !== "ready") {
    return block.state;
  }
  return block.data.length === 0 ? "hidden" : "filled";
}

function todayStatus(block: HomeViewModel["today"]): HomeBlockStatus {
  if (block.state !== "ready") {
    return block.state;
  }
  return block.data === null ? "hidden" : "filled";
}

function weekStatus(block: HomeViewModel["week"]): HomeBlockStatus {
  if (block.state !== "ready") {
    return block.state;
  }
  return block.data.days.some((day) => day.hasShift) ? "filled" : "empty";
}

function upcomingStatus(block: HomeViewModel["upcoming"]): HomeBlockStatus {
  if (block.state !== "ready") {
    return block.state;
  }
  return block.data.length === 0 ? "empty" : "filled";
}

function payStatus(block: HomeViewModel["pay"]): HomeBlockStatus {
  if (block.state !== "ready") {
    return block.state;
  }
  return block.data.rows.some((row) => row.amount !== null) ? "filled" : "empty";
}

function isVisibleStatus(status: HomeBlockStatus): status is Exclude<HomeBlockStatus, "hidden"> {
  return status !== "hidden";
}

export function toHomeBlocks(model: HomeViewModel, now: Date): HomeBlockPlan {
  void now;

  const statuses: Record<HomeBlockName, HomeBlockStatus> = {
    notices: noticesStatus(model.notices),
    today: todayStatus(model.today),
    week: weekStatus(model.week),
    upcoming: upcomingStatus(model.upcoming),
    pay: payStatus(model.pay),
  };

  return HOME_BLOCK_NAMES.reduce<HomeBlockPlan>((plan, block) => {
    const status = statuses[block];
    return isVisibleStatus(status) ? [...plan, { block, status }] : plan;
  }, []);
}
