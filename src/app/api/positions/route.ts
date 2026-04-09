import { NextResponse } from "next/server";
import { readPositions } from "#/entities/positions/repositories/positionRepository";

export async function GET() {
  const positions = await readPositions();

  return NextResponse.json({ positions });
}
