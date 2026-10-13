import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { SubmitProfileInput } from "@/features/profileEdit/model/profileEdit.type";

export async function submitProfile(
  client: DB,
  { displayName, phone, birthDate, gender }: SubmitProfileInput,
): Promise<void> {
  const { error } = await client.rpc("submit_profile", {
    display_name: displayName,
    phone,
    birth_date: birthDate,
    gender,
  });

  if (error) {
    throw toApiError(error);
  }
}
