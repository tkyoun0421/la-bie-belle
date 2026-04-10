import { NextResponse } from "next/server";
import {
  positionErrors,
  positionErrorCodes,
} from "#/entities/positions/models/errors/positionError";
import { readPositions } from "#/entities/positions/repositories/readPositionRepository";
import {
  AdminAccessError,
  requireAdminActor,
} from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdminActor();

    const client = createSupabaseAdminClient();
    const positions = await readPositions({ client });

    return NextResponse.json({ positions });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[GET /api/positions]", error);

    return NextResponse.json(
      {
        errorCode:
          positionErrors.read(error) ?? positionErrorCodes.listFailed,
      },
      { status: 500 }
    );
  }
}
