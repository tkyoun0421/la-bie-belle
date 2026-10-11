import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import type { PickPhotoDeps } from "@/features/profileEdit/lib/pickPhoto.lib";

export const PHOTO_PICK_DEPS: PickPhotoDeps<ImageManipulator.SaveFormat> = {
  launchImageLibraryAsync: () =>
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
    }),
  manipulateAsync: (uri, actions, options) =>
    ImageManipulator.manipulateAsync(uri, actions, options),
  saveFormatJpeg: ImageManipulator.SaveFormat.JPEG,
};
