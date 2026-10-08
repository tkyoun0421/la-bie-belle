import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_CLOCK_STORAGE_KEY } from "@/entities/clock/consts/clock.const";

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
