import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_CLOCK_STORAGE_KEY } from "@/entities/clock/consts/clock.const";

/**
 * 서버와 기기의 시각 차이가 기기에 남고 돌아오는 자리다. store는 값을 들기만 하고 디스크에
 * 닿는 손은 여기다 — 가르지 않으면 store 테스트가 AsyncStorage를 흉내야 한다.
 *
 * 읽기가 실패하면 널이고(부르는 쪽이 0으로 좁힌다) 쓰기가 실패하면 이번 실행 동안만 산다.
 * 시각은 보여주기용이라 판정은 함수의 `now()`가 하고, 이 값을 기다리다 앱이 못 뜨는 쪽이 더
 * 나쁘다.
 */

export async function readStoredOffset(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SERVER_CLOCK_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredOffset(offset: number): void {
  void AsyncStorage.setItem(SERVER_CLOCK_STORAGE_KEY, String(offset)).catch(
    () => {},
  );
}
