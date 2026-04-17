import { NextRequest, NextResponse } from "next/server";
import { readReplacementApplications } from "#/entities/replacements/repositories/readReplacementRepository";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;

  try {
    const client = await createSupabaseServerClient();
    const applications = await readReplacementApplications(requestId, { client });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error(`[GET /api/replacements/${requestId}/applications]`, error);

    return NextResponse.json(
      {
        errorCode: "REPLACEMENT_APPLICATION_LIST_FAILED",
      },
      { status: 500 }
    );
  }
}
