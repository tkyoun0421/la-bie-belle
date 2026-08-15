export type ConfirmedRosterRow = {
  name: string;
  positionName: string;
  sortOrder: number;
  isTrainee: boolean;
  isSelf: boolean;
};

export type ConfirmedRosterRowApiRow = {
  name: string;
  position_name: string;
  sort_order: number;
  is_trainee: boolean;
  is_self: boolean;
};

export function mapConfirmedRosterRow(row: ConfirmedRosterRowApiRow): ConfirmedRosterRow {
  return {
    name: row.name,
    positionName: row.position_name,
    sortOrder: row.sort_order,
    isTrainee: row.is_trainee,
    isSelf: row.is_self,
  };
}

export type ConfirmedRoster = {
  plannedCheckin: string;
  plannedCheckout: string;
  ceremonyTimes: string[];
  roster: ConfirmedRosterRow[];
  revision: number;
  revisedAt: string;
};

export type ConfirmedRosterApiPayload = {
  planned_checkin: string;
  planned_checkout: string;
  ceremonies: string[];
  roster: ConfirmedRosterRowApiRow[];
  revision: number;
  revised_at: string;
};

export function mapConfirmedRoster(payload: ConfirmedRosterApiPayload): ConfirmedRoster {
  return {
    plannedCheckin: payload.planned_checkin,
    plannedCheckout: payload.planned_checkout,
    ceremonyTimes: payload.ceremonies,
    roster: payload.roster.map(mapConfirmedRosterRow),
    revision: payload.revision,
    revisedAt: payload.revised_at,
  };
}
