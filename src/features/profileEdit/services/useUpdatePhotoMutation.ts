import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  uploadAvatar,
  type UploadAvatarInput,
} from "@/features/profileEdit/api/avatarsBucket.api";
import { updateMyPhoto } from "@/features/profileEdit/api/updateMyPhoto.api";

/**
 * 사진 바꾸기다. 들어오는 길이 둘이고 나가는 자리는 하나다 — 기기에서 고른 사진은 버킷에
 * 올린 뒤 그 공개 주소를 앉히고, 「구글 사진으로」는 이미 공개 주소라 올릴 것이 없다
 * (`docs/2-design/modules/account/design.md`의 「사진 저장」,
 * `docs/2-design/modules/account/screens/profile.md`의 「사진 고치기」).
 *
 * 두 길을 한 자리로 묶은 것은 뒤가 같아서다. 올리든 안 올리든 `profiles.photo_url`을 바꾸고
 * `['profile']`을 무효화하는 것은 하나이고, 그 순서가 두 군데 적히면 한쪽만 무효화를
 * 빠뜨린다.
 *
 * **올리기가 실패하면 사진을 안 앉힌다.** 올라가지도 않은 주소가 프로필에 박히면 목록마다
 * 깨진 원이 선다.
 */

export type UpdatePhotoInput = UploadAvatarInput | { photoUrl: string };

function isPicked(input: UpdatePhotoInput): input is UploadAvatarInput {
  return "uri" in input;
}

export type UpdatePhotoResult = {
  mutate: (input: UpdatePhotoInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useUpdatePhotoMutation(client: DB): UpdatePhotoResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: async (input: UpdatePhotoInput) => {
      const photoUrl = isPicked(input)
        ? await uploadAvatar(client, input)
        : input.photoUrl;

      await updateMyPhoto(client, photoUrl);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
  });

  return { mutate, isPending, isSuccess, isError, error, reset };
}
