import { NextResponse } from "next/server";
import { readPositions } from "#/entities/positions/repositories/positionRepository";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

export async function GET() {
  const client = createSupabaseAdminClient();
  const positions = await readPositions({ client });

  return NextResponse.json({ positions });
}
