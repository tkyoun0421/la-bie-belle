import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { PHOTO_SHEET_COPY } from "@/features/profileEdit/consts/profileEdit.const";
import { PHOTO_PICK_DEPS } from "@/features/profileEdit/lib/photoPickDeps.lib";
import { pickAndShrinkPhoto } from "@/features/profileEdit/lib/pickPhoto.lib";
import { shouldOfferGooglePhoto } from "@/features/profileEdit/model/shouldOfferGooglePhoto.policy";
import { useUpdatePhotoMutation } from "@/features/profileEdit/services/useUpdatePhotoMutation";

export type PhotoSheetInput = {
  userId: string | null;
  photoUrl: string | null;
  googlePhotoUrl: string | null;
  onSaved: () => void;
};

export type PhotoSheetController = {
  offerGoogle: boolean;
  sending: boolean;
  failedLine: string | null;
  pick: () => Promise<void>;
  useGoogle: () => void;
};

export function usePhotoSheet({
  userId,
  photoUrl,
  googlePhotoUrl,
  onSaved,
}: PhotoSheetInput): PhotoSheetController {
  const [picking, setPicking] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);

  const {
    mutate,
    isPending: sending,
    isSuccess: saved,
    isError: sendFailed,
  } = useUpdatePhotoMutation(supabase);

  useEffect(() => {
    if (saved) {
      onSaved();
    }
  }, [saved, onSaved]);

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

  const useGoogle = useCallback(() => {
    if (googlePhotoUrl !== null) {
      mutate({ photoUrl: googlePhotoUrl });
    }
  }, [googlePhotoUrl, mutate]);

  const failed = pickFailed || sendFailed;

  return {
    offerGoogle: shouldOfferGooglePhoto(photoUrl, googlePhotoUrl),
    sending: picking || sending,
    failedLine: failed ? PHOTO_SHEET_COPY.failed : null,
    pick,
    useGoogle,
  };
}
