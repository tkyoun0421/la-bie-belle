import { readEvents } from "#/entities/events/repositories/readEventRepository";
import { DashboardScreen } from "#/screens/dashboard/DashboardScreen";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const client = await createSupabaseServerClient();
  const events = await readEvents({ client });

  return <DashboardScreen events={events} />;
}
