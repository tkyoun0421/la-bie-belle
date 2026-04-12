import { NextResponse } from "next/server";
import { eventErrors, eventErrorCodes } from "#/entities/events/models/errors/eventError";
import { readEventCollectionWithApplicationStatus } from "#/queries/events/services/readEventCollectionWithApplicationStatus";
import { hasPublicSupabaseEnv } from "#/shared/config/env";
import { getCurrentAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

export async function GET() {
  if (!hasPublicSupabaseEnv()) {
    return NextResponse.json({ events: [] });
  }

  try {
    const client = await createSupabaseServerClient();
    const actor = await getCurrentAppActor({ client });
    const events = await readEventCollectionWithApplicationStatus({
      client,
      viewerId: actor?.userId ?? null,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[GET /api/events]", error);

    return NextResponse.json(
      {
        errorCode: eventErrors.read(error) ?? eventErrorCodes.listFailed,
      },
      { status: 500 }
    );
  }
}
