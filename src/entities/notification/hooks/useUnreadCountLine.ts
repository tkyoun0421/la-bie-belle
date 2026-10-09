import { supabase } from "@/shared/api/supabase";
import { useUnreadCountSuspenseQuery } from "@/entities/notification/services/useUnreadCountSuspenseQuery";
import { spellUnreadCount } from "@/entities/notification/utils/spellUnreadCount.utils";

export type UnreadCountLineController = {
  line: string;
};

export function useUnreadCountLine(): UnreadCountLineController {
  const { data } = useUnreadCountSuspenseQuery(supabase);

  return { line: spellUnreadCount(data) };
}
