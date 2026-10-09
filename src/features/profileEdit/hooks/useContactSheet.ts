import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import { isValidPhone } from "@/entities/profile/model/profile.schema";
import {
  digitsOnly,
  hyphenatePhone,
} from "@/entities/profile/utils/phoneDigits.utils";
import { PHONE_LENGTH } from "@/features/profileEdit/consts/profileEdit.const";
import { canSaveContact } from "@/features/profileEdit/model/canSaveContact.policy";
import { useUpdateContactMutation } from "@/features/profileEdit/services/useUpdateContactMutation";

const REJECTED_CODE = "invalid_phone";

export type ContactSheetInput = {
  profileId: string;
  phone: string;
  onSaved: () => void;
};

export type ContactSheetController = {
  draft: string;
  saving: boolean;
  failed: boolean;
  invalid: boolean;
  canSave: boolean;
  write: (typed: string) => void;
  save: () => void;
};

export function useContactSheet({
  profileId,
  phone,
  onSaved,
}: ContactSheetInput): ContactSheetController {
  const current = digitsOnly(phone, PHONE_LENGTH);
  const [draft, setDraft] = useState(current);

  const {
    mutate,
    isPending: saving,
    isSuccess: saved,
    error,
  } = useUpdateContactMutation(supabase);

  useEffect(() => {
    if (saved) {
      onSaved();
    }
  }, [saved, onSaved]);

  const code = errorCodeOf(error);
  const rejected = code === REJECTED_CODE;

  const write = useCallback((typed: string) => {
    setDraft(digitsOnly(typed, PHONE_LENGTH));
  }, []);

  const save = useCallback(() => {
    mutate({ profileId, phone: hyphenatePhone(draft) });
  }, [mutate, profileId, draft]);

  return {
    draft,
    saving,
    failed: error !== null && !rejected,
    invalid:
      (draft.length === PHONE_LENGTH && !isValidPhone(draft)) || rejected,
    canSave: canSaveContact(current, draft),
    write,
    save,
  };
}
