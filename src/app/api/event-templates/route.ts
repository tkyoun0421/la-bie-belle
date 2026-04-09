import { NextResponse } from "next/server";
import { readEventTemplates } from "#/entities/events/repositories/eventTemplateRepository";

export async function GET() {
  const templates = await readEventTemplates();

  return NextResponse.json({ templates });
}
