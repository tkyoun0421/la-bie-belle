import { NextResponse } from "next/server";
import { readEventApplicants } from "#/entities/assignments/repositories/readAssignmentRepository";
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
    const applicants = await readEventApplicants(eventId, { client });

    return NextResponse.json({ applicants });
  } catch (error) {
    console.error(`[GET /api/events/${eventId}/applicants]`, error);

    return NextResponse.json(
      {
        errorCode:
          assignmentErrors.read(error) ?? assignmentErrorCodes.listFailed,
      },
      { status: 500 }
    );
  }
}
