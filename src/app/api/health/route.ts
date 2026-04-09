import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "la-bie-belle",
    timestamp: new Date().toISOString()
  });
}
