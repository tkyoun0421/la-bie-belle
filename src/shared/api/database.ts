import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/api/databaseTypes";

export type { Database };

export type DB = SupabaseClient<Database>;
