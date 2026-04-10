import { NextResponse } from "next/server";
import { readEventTemplates } from "#/entities/events/repositories/eventTemplateRepository";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

export async function GET() {
  const client = createSupabaseAdminClient();
  const templates = await readEventTemplates({ client });

  return NextResponse.json({ templates });
}
