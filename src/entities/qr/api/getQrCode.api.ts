import type { DB } from "@/shared/api/database";
import type { HallQrCode } from "@/entities/qr/model/qr.type";

export async function getQrCode(client: DB): Promise<HallQrCode | null> {
  const { data, error } = await client
    .from("hall_secrets")
    .select("qr_code, rotated_at")
    .limit(1)
    .maybeSingle<{ qr_code: string; rotated_at: string }>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return { qrCode: data.qr_code, rotatedAt: data.rotated_at };
}
