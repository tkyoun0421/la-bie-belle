import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { serverOffset } from "@/entities/clock/model/serverClock.policy";

/**
 * 서버 시각과 기기 시각의 차이가 사는 자리 하나다. 재는 곳은 껍데기(`src/app/_layout.tsx`)고
 * 쓰는 곳은 요청 카운트다운과 픽커의 만료 판정이라, 값을 화면이 들고 있으면 다른 화면이
 * 그것을 못 본다.
 *
 * **기기에 남긴다.** 앱이 뜨자마자 그리는 첫 화면은 아직 `server_now()`의 답을 못 받았는데,
 * 그때 0을 쓰면 시계가 어긋난 기기에서 카운트다운이 한 번 튄다. 지난번에 잰 차이를 먼저
 * 깔고 답이 오면 덮는다 — 저장소가 비었거나 읽기가 실패하면 0이다(runtime.md 「시각」).
 *
 * **스플래시를 안 막는다.** 시각은 보여주기용이라 판정은 함수의 `now()`가 한다 — 이 값을
 * 기다리다 앱이 못 뜨는 쪽이 더 나쁘다.
 *
 * 이름이 `use`로 안 시작하는 것은 파일 이름을 훅 규약(`useServerClock.ts`)으로 끌지 않으려는
 * 것이다. 오프셋을 읽는 손은 훅이 아니라 상태 하나라 kebab 이름이 맞고, 실제 서버 상태를
 * 읽는 훅은 `features/`에 따로 세우지 않았다(plan 「총괄이 정한 것」 2).
 */

export const SERVER_CLOCK_STORAGE_KEY = "server-clock-offset";

type ServerClockStore = {
  offset: number;
  restore: () => Promise<void>;
  adopt: (serverNowIso: string, deviceNowMs: number) => void;
};

function parseOffset(raw: string | null): number {
  const parsed = Number(raw);

  return raw === null || Number.isNaN(parsed) ? 0 : parsed;
}

async function readStoredOffset(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SERVER_CLOCK_STORAGE_KEY);
  } catch {
    return null;
  }
}

export const serverClockStore = create<ServerClockStore>((set) => ({
  offset: 0,

  async restore() {
    set({ offset: parseOffset(await readStoredOffset()) });
  },

  adopt(serverNowIso, deviceNowMs) {
    const offset = serverOffset(serverNowIso, deviceNowMs);

    set({ offset });
    void AsyncStorage.setItem(SERVER_CLOCK_STORAGE_KEY, String(offset)).catch(
      () => {},
    );
  },
}));
