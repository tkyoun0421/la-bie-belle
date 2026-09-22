import type { SupabaseClient } from "@supabase/supabase-js";
import { toApiError } from "@/shared/api/errors";

export type HallLocation = {
  lat: number;
  lng: number;
  radiusM: number;
};

export async function setHallLocation(
  client: SupabaseClient,
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
