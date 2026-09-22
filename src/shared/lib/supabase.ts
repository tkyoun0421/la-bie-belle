import { createSupabaseClient } from "@/shared/lib/create-supabase-client";
import { readSupabaseEnv } from "@/shared/lib/read-supabase-env";

const { url, anonKey } = readSupabaseEnv();

/**
 * 앱 전체가 무는 클라이언트 하나. 세션 저장소를 들고 있어서 둘을 만들면 같은 자리를
 * 두 손이 쓰게 된다. env가 비면 여기서 바로 터지는 편이 낫다 — EXPO_PUBLIC_* 는
 * 빌드 시점에 박히는 값이라 실행 중에 채워 넣을 길이 없다.
 */
export const supabase = createSupabaseClient(url, anonKey);
