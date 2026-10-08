import {
  PHOTO_CONTENT_TYPE,
  PHOTO_EDGE,
  PHOTO_EXTENSION,
  PHOTO_QUALITY,
} from "@/features/profileEdit/consts/profileEdit.const";

export type PickedAsset = { uri: string };

export type PickPhotoDeps = {
  launchImageLibraryAsync: () => Promise<{
    canceled: boolean;
    assets: PickedAsset[] | null;
  }>;
  manipulateAsync: (
    uri: string,
    actions: { resize: { width: number; height: number } }[],
    options: { compress: number; format: unknown },
  ) => Promise<{ uri: string }>;
  saveFormatJpeg: unknown;
};

export type PickedPhoto = {
  uri: string;
  contentType: string;
  extension: string;
};

export async function pickAndShrinkPhoto(
  deps: PickPhotoDeps,
): Promise<PickedPhoto | null> {
  const picked = await deps.launchImageLibraryAsync();

  if (picked.canceled || !picked.assets?.length) {
    return null;
  }

  const shrunk = await deps.manipulateAsync(
    picked.assets[0].uri,
    [{ resize: { width: PHOTO_EDGE, height: PHOTO_EDGE } }],
    { compress: PHOTO_QUALITY, format: deps.saveFormatJpeg },
  );

  return {
    uri: shrunk.uri,
    contentType: PHOTO_CONTENT_TYPE,
    extension: PHOTO_EXTENSION,
  };
}
