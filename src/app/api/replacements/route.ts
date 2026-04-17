import { NextResponse } from "next/server";
import { readOpenReplacementRequests } from "#/entities/replacements/repositories/readReplacementRepository";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

export async function GET() {
  try {
    const client = await createSupabaseServerClient();
    const replacements = await readOpenReplacementRequests({ client });

    return NextResponse.json({ replacements });
  } catch (error) {
    console.error(`[GET /api/replacements]`, error);

    return NextResponse.json(
      {
        errorCode: "REPLACEMENT_LIST_FAILED",
      },
      { status: 500 }
    );
  }
}
