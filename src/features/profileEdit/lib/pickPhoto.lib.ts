import {
  PHOTO_CONTENT_TYPE,
  PHOTO_EDGE,
  PHOTO_EXTENSION,
  PHOTO_QUALITY,
} from "@/features/profileEdit/consts/profileEdit.const";

/**
 * 기기 앨범에서 사진을 고르고 올릴 크기로 줄이는 순서다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「사진 고치기」다.
 *
 * **고르는 것과 올리는 것이 갈린다.** 여기는 기기까지고, 버킷에 올리고 프로필에 앉히는
 * 뒷일은 `useUpdatePhotoMutation`이 든다 — 올라가지도 않은 주소가 박히는 일이 없게 그
 * 순서가 한자리에 있다.
 *
 * **고르다 말면 `null`이다.** 그것은 실패가 아니라 사람이 그만둔 것이라 화면에 「못
 * 올렸어요」가 서면 안 된다. 줄이다 넘어진 것만 던진다.
 *
 * 기기에 붙는 함수는 전부 주입받는다. 여기가 `expo-image-picker`를 직접 물면 이 순서가
 * 기기 없이는 안 돈다 — 실물을 묶는 자리는 [`photoPickDeps.lib.ts`](photoPickDeps.lib.ts)다.
 */

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
