import type { Db } from "@/shared/api/database";

export const QR_CODE_STALE_TIME_MS = 0;

export function qrCodeKey(): string[] {
  return ["hall", "qr"];
}

export async function getQrCode(client: Db): Promise<string | null> {
  const { data, error } = await client
    .from("hall_secrets")
    .select("qr_code")
    .limit(1)
    .maybeSingle<{ qr_code: string }>();

  if (error) {
    throw error;
  }

  return data?.qr_code ?? null;
}
