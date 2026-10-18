import { createSupabaseClient } from "@/shared/api/createSupabaseClient";
import {
  missingSupabaseEnv,
  readSupabaseEnv,
} from "@/shared/config/supabase.config";
import { UNCONFIGURED_SUPABASE_ENV } from "@/shared/consts/supabase.const";

export const supabaseConfigured = missingSupabaseEnv().length === 0;

const { url, anonKey } = supabaseConfigured
  ? readSupabaseEnv()
  : UNCONFIGURED_SUPABASE_ENV;

export const supabase = createSupabaseClient(url, anonKey);
