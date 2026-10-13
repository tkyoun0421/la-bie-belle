import type { DB } from "@/shared/api/database";

export type CheckInDeps = {
  client: DB;
  wait?: (ms: number) => Promise<void>;
};
