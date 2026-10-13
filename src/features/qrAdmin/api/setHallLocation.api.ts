import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { HallLocation } from "@/features/qrAdmin/model/qrAdmin.type";

export async function setHallLocation(
  client: DB,
  location: HallLocation,
): Promise<void> {
  const { error } = await client.rpc("set_hall_location", {
    p_lat: location.lat,
    p_lng: location.lng,
    p_radius_m: location.radiusM,
  });

  if (error) {
    throw toApiError(error);
  }
}
