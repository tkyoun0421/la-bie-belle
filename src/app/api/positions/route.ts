import { NextResponse } from "next/server";
import { readPositions } from "#/queries/positions/models/repositories/positionRepository";

export async function GET() {
  const positions = await readPositions();

  return NextResponse.json({ positions });
}
