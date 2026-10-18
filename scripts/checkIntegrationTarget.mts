import { localDbContainer } from "@tests/integration/postgres";
import { localSupabase } from "@tests/integration/supabase";

try {
  localSupabase();
  localDbContainer();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
