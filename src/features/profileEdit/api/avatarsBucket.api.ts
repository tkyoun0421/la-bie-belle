import "react-native-get-random-values";
import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { AVATARS_BUCKET } from "@/features/profileEdit/consts/profileEdit.const";

const NAME_BYTES = 16;

function randomFileName(extension: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(NAME_BYTES));
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `${hex}.${extension}`;
}

export type UploadAvatarInput = {
  userId: string;
  uri: string;
  contentType: string;
  extension: string;
};

export async function uploadAvatar(
  client: DB,
  { userId, uri, contentType, extension }: UploadAvatarInput,
): Promise<string> {
  const bytes = await (await fetch(uri)).arrayBuffer();
  const path = `${userId}/${randomFileName(extension)}`;
  const bucket = client.storage.from(AVATARS_BUCKET);

  const { error } = await bucket.upload(path, bytes, { contentType });

  if (error) {
    throw toApiError(error);
  }

  return bucket.getPublicUrl(path).data.publicUrl;
}
