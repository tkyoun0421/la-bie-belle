import { createSupabaseClient } from "@/shared/api/createSupabaseClient";
import { readSupabaseEnv } from "@/shared/config/supabase.config";

const { url, anonKey } = readSupabaseEnv();

export const supabase = createSupabaseClient(url, anonKey);
