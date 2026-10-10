import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { PROFILE_FORM_COPY } from "@/features/profileEdit/consts/profileEdit.const";
import { PHOTO_PICK_DEPS } from "@/features/profileEdit/lib/photoPickDeps.lib";
import { pickAndShrinkPhoto } from "@/features/profileEdit/lib/pickPhoto.lib";
import { useUpdatePhotoMutation } from "@/features/profileEdit/services/useUpdatePhotoMutation";

export type PendingEditorInput = {
  userId: string | null;
  onUploaded: () => void;
};

export type PendingEditorController = {
  sending: boolean;
  failedLine: string | null;
  pick: () => Promise<void>;
};

export function usePendingEditor({
  userId,
  onUploaded,
}: PendingEditorInput): PendingEditorController {
  const [picking, setPicking] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);

  const {
    mutate,
    isPending: sending,
    isSuccess: saved,
    isError: sendFailed,
    reset,
  } = useUpdatePhotoMutation(supabase);

  useEffect(() => {
    if (saved) {
      reset();
      onUploaded();
    }
  }, [saved, reset, onUploaded]);

  const pick = useCallback(async () => {
    setPicking(true);
    setPickFailed(false);

    try {
      const picked = await pickAndShrinkPhoto(PHOTO_PICK_DEPS);

      if (picked !== null && userId !== null) {
        mutate({ userId, ...picked });
      }
    } catch {
      setPickFailed(true);
    } finally {
      setPicking(false);
    }
  }, [userId, mutate]);

  const failed = pickFailed || sendFailed;

  return {
    sending: picking || sending,
    failedLine: failed ? PROFILE_FORM_COPY.photoFailed : null,
    pick,
  };
}
