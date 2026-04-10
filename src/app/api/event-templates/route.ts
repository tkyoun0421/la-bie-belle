import { NextResponse } from "next/server";
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
      { error: "행사 템플릿 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
