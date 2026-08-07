import type { GenderValue } from "@/entities/identity/model/signup";
import type { ProfileStatus } from "@/entities/identity/model/profile-gate";

export type WorkerListItem = {
  id: string;
  name: string;
  status: ProfileStatus;
};

export type WorkerPosition = {
  id: string;
  name: string;
  isDefault: boolean;
  granted: boolean;
};

export type WorkerDetail = {
  id: string;
  name: string;
  gender: GenderValue;
  birthDate: string;
  phone: string;
  status: ProfileStatus;
  hourlyWage: number | null;
  defaultHourlyWage: number;
  positions: WorkerPosition[];
};

export type OwnWorkerInfo = {
  name: string;
  gender: GenderValue;
  birthDate: string;
  phone: string;
  hourlyWage: number | null;
  defaultHourlyWage: number;
};
