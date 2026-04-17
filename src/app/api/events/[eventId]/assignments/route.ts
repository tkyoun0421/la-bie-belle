import { NextResponse } from "next/server";
import { readEventAssignments } from "#/entities/assignments/repositories/readAssignmentRepository";
import {
  assignmentErrors,
  assignmentErrorCodes,
} from "#/entities/assignments/models/errors/assignmentError";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const client = await createSupabaseServerClient();
    const assignments = await readEventAssignments(eventId, { client });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error(`[GET /api/events/${eventId}/assignments]`, error);

    return NextResponse.json(
      {
        errorCode:
          assignmentErrors.read(error) ?? assignmentErrorCodes.listFailed,
      },
      { status: 500 }
    );
  }
}
