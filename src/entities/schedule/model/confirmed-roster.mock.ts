import type { ConfirmedRoster } from "@/entities/schedule/model/confirmed-roster";

export const CONFIRMED_ROSTER_GENERAL: ConfirmedRoster = {
  plannedCheckin: "09:00",
  plannedCheckout: "18:00",
  ceremonyTimes: ["14:00"],
  roster: [
    { name: "정하은", positionName: "매니저", sortOrder: 80, isTrainee: false, isSelf: true },
    { name: "김민준", positionName: "매니저", sortOrder: 80, isTrainee: false, isSelf: false },
    { name: "이서연", positionName: "안내", sortOrder: 90, isTrainee: false, isSelf: false },
  ],
  revision: 1,
  revisedAt: "2026-08-01T09:00:00.000000+00:00",
};

export const CONFIRMED_ROSTER_WITH_TRAINEE: ConfirmedRoster = {
  plannedCheckin: "10:00",
  plannedCheckout: "19:00",
  ceremonyTimes: ["15:00"],
  roster: [
    ...CONFIRMED_ROSTER_GENERAL.roster,
    { name: "박도윤", positionName: "매니저", sortOrder: 80, isTrainee: true, isSelf: false },
  ],
  revision: 1,
  revisedAt: "2026-08-01T09:00:00.000000+00:00",
};

export const CONFIRMED_ROSTER_UNASSIGNED: ConfirmedRoster = {
  plannedCheckin: "09:00",
  plannedCheckout: "18:00",
  ceremonyTimes: ["14:00"],
  roster: [
    { name: "김민준", positionName: "매니저", sortOrder: 80, isTrainee: false, isSelf: false },
    { name: "이서연", positionName: "안내", sortOrder: 90, isTrainee: false, isSelf: false },
  ],
  revision: 1,
  revisedAt: "2026-08-01T09:00:00.000000+00:00",
};
