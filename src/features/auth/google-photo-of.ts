const PHOTO_KEYS = ["avatar_url", "picture"];

export function googlePhotoOf(
  metadata: Record<string, unknown>,
): string | null {
  for (const key of PHOTO_KEYS) {
    const value = metadata[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}
