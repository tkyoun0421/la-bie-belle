import type {
  BLOCKED_PATH,
  LEFT_PATH,
  LOGIN_PATH,
  PENDING_PATH,
  WORKER_HOME_PATH,
} from "@/shared/consts/navigation.const";

export type AuthDestination =
  | typeof LOGIN_PATH
  | typeof PENDING_PATH
  | typeof BLOCKED_PATH
  | typeof LEFT_PATH
  | typeof WORKER_HOME_PATH;

export type SessionUser = {
  id: string;
  email: string;
  googlePhotoUrl: string | null;
};
