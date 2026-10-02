import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import type { PickPhotoDeps } from "@/features/profileEdit/lib/pickPhoto.lib";

/**
 * 기기에 붙는 함수들을 [`pickPhoto.lib.ts`](pickPhoto.lib.ts)가 받는 꼴로 묶는 자리다.
 * 순서는 저쪽이 들고 여기는 실물만 건넨다.
 *
 * **고르는 창의 설정이 여기 산다.** 정사각으로 잘라 받는 것은 어느 화면에서 고르든 같아서
 * 부르는 쪽이 정할 것이 없다 — 앱의 사진은 전부 원이다.
 */

export const PHOTO_PICK_DEPS: PickPhotoDeps = {
  launchImageLibraryAsync: () =>
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
    }),
  manipulateAsync: (uri, actions, options) =>
    ImageManipulator.manipulateAsync(
      uri,
      actions,
      options as ImageManipulator.SaveOptions,
    ),
  saveFormatJpeg: ImageManipulator.SaveFormat.JPEG,
};
