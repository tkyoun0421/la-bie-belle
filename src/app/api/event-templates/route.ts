import { NextResponse } from "next/server";
import { readEventTemplates } from "#/queries/events/models/repositories/eventTemplateRepository";

export async function GET() {
  const templates = await readEventTemplates();

  return NextResponse.json({ templates });
}
