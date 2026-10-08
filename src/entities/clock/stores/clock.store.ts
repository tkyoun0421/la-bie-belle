import { create } from "zustand";
import {
  readStoredOffset,
  writeStoredOffset,
} from "@/entities/clock/lib/clockStorage.lib";
import { serverOffset } from "@/entities/clock/model/serverClock.policy";

type ServerClockStore = {
  offset: number;
  restore: () => Promise<void>;
  adopt: (serverNowIso: string, deviceNowMs: number) => void;
};

function parseOffset(raw: string | null): number {
  const parsed = Number(raw);

  return raw === null || Number.isNaN(parsed) ? 0 : parsed;
}

export const serverClockStore = create<ServerClockStore>((set) => ({
  offset: 0,

  async restore() {
    set({ offset: parseOffset(await readStoredOffset()) });
  },

  adopt(serverNowIso, deviceNowMs) {
    const offset = serverOffset(serverNowIso, deviceNowMs);

    set({ offset });
    writeStoredOffset(offset);
  },
}));
