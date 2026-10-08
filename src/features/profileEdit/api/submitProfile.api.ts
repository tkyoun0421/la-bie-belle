import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export type SubmitProfileInput = {
  displayName: string;
  phone: string;
  birthDate: string;
  gender: string;
};

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
