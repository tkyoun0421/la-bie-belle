import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { formatBirthDate } from "@/entities/profile/utils/formatBirthDate.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import {
  DECISION_COPY,
  DETAIL_SHEET_COPY,
  DETAIL_SHEET_TOAST,
} from "@/features/memberAdmin/consts/memberAdmin.const";
import type { DetailSheetFace } from "@/features/memberAdmin/model/memberAdmin.type";
import type {
  MemberDetailSheetAsk,
  MemberDetailSheetController,
  MemberDetailSheetInput,
  MemberDetailSheetValueRow,
} from "@/features/memberAdmin/model/memberDetailSheet.type";
import { useApproveMemberMutation } from "@/features/memberAdmin/services/useApproveMemberMutation";
import { useBlockMemberMutation } from "@/features/memberAdmin/services/useBlockMemberMutation";
import { useRejectMemberMutation } from "@/features/memberAdmin/services/useRejectMemberMutation";

export function useMemberDetailSheet({
  profileId,
  name,
  photoUrl,
  sentAt,
  values,
  today,
  onDone,
}: MemberDetailSheetInput): MemberDetailSheetController {
  const [menuOpen, setMenuOpen] = useState(false);
  const [face, setFace] = useState<DetailSheetFace>("detail");

  const {
    mutate: sendApprove,
    isPending: approving,
    error: approveError,
  } = useApproveMemberMutation(supabase);

  const {
    mutate: sendReject,
    isPending: rejecting,
    error: rejectError,
  } = useRejectMemberMutation(supabase);

  const {
    mutate: sendBlock,
    isPending: blocking,
    error: blockError,
  } = useBlockMemberMutation(supabase);

  const callbacksFor = useCallback(
    (doneSuffix: string): MutationCallbacks => ({
      onSuccess: () =>
        onDone({ kind: "success", message: `${name}${doneSuffix}` }),
      onError: (error) => {
        if (errorCodeOf(error) === "already_decided") {
          onDone({ kind: "info", message: DETAIL_SHEET_TOAST.alreadyDecided });
        }
      },
    }),
    [name, onDone],
  );

  const errors = [approveError, rejectError, blockError];

  const failed = errors.some(
    (error) => error !== null && errorCodeOf(error) !== "already_decided",
  );

  const ask = useMemo<MemberDetailSheetAsk | null>(() => {
    if (face === "detail") {
      return null;
    }

    const asked = DECISION_COPY[face];

    return {
      question: `${name}${asked.questionSuffix}`,
      note: asked.note,
      confirmLabel: asked.action,
      destructive: face === "block",
    };
  }, [face, name]);

  const valueRows = useMemo<MemberDetailSheetValueRow[]>(() => {
    if (ask !== null) {
      return [];
    }

    return [
      {
        label: DETAIL_SHEET_COPY.genderLabel,
        value: values === null ? "" : spellGender(values.gender),
        numeric: false,
      },
      {
        label: DETAIL_SHEET_COPY.birthLabel,
        value: values?.birthDate
          ? formatBirthDate(values.birthDate, today)
          : "",
        numeric: true,
      },
      {
        label: DETAIL_SHEET_COPY.phoneLabel,
        value: values?.phone ?? "",
        numeric: true,
      },
      {
        label: DETAIL_SHEET_COPY.emailLabel,
        value: values?.email ?? "",
        numeric: false,
      },
    ];
  }, [ask, values, today]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  const pressMenu = useCallback(() => {
    setMenuOpen(false);
    setFace("block");
  }, []);

  const approve = useCallback(() => {
    sendApprove({ profileId }, callbacksFor(DETAIL_SHEET_TOAST.approvedSuffix));
  }, [sendApprove, profileId, callbacksFor]);

  const confirm = useCallback(() => {
    if (face === "detail") {
      return;
    }

    if (face === "reject") {
      sendReject(
        { profileId },
        callbacksFor(DETAIL_SHEET_TOAST.rejectedSuffix),
      );
      return;
    }

    sendBlock({ profileId }, callbacksFor(DETAIL_SHEET_TOAST.blockedSuffix));
  }, [face, profileId, sendReject, sendBlock, callbacksFor]);

  return {
    name,
    photoUrl,
    ask,
    showMenu: ask === null,
    menuOpen,
    sending: approving || rejecting || blocking,
    toggleMenu,
    pressMenu,
    showFace: setFace,
    approve,
    confirm,
    valueRows,
    sentAt,
    failedLine: failed ? DETAIL_SHEET_COPY.sendFailed : null,
  };
}
