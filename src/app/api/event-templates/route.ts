import { NextResponse } from "next/server";
import {
  eventTemplateErrorCodes,
  readEventTemplateErrorCode,
} from "#/entities/events/models/errors/eventTemplateError";
import { readEventTemplates } from "#/entities/events/repositories/readEventTemplateRepository";
import {
  AdminAccessError,
  requireAdminActor,
} from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdminActor();

    const client = createSupabaseAdminClient();
    const templates = await readEventTemplates({ client });

    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[GET /api/event-templates]", error);

    return NextResponse.json(
      {
        errorCode:
          readEventTemplateErrorCode(error) ??
          eventTemplateErrorCodes.listFailed,
      },
      { status: 500 }
    );
  }
}
