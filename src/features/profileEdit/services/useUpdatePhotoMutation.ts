import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import {
  uploadAvatar,
  type UploadAvatarInput,
} from "@/features/profileEdit/api/avatarsBucket.api";
import { updateMyPhoto } from "@/features/profileEdit/api/updateMyPhoto.api";

export type UpdatePhotoInput = UploadAvatarInput | { photoUrl: string };

function isPicked(input: UpdatePhotoInput): input is UploadAvatarInput {
  return "uri" in input;
}

export type UpdatePhotoResult = {
  mutate: (input: UpdatePhotoInput, callbacks?: MutationCallbacks) => void;
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
