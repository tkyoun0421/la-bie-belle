import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
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
    isSuccess: approved,
    error: approveError,
  } = useApproveMemberMutation(supabase);

  const {
    mutate: sendReject,
    isPending: rejecting,
    isSuccess: rejected,
    error: rejectError,
  } = useRejectMemberMutation(supabase);

  const {
    mutate: sendBlock,
    isPending: blocking,
    isSuccess: blocked,
    error: blockError,
  } = useBlockMemberMutation(supabase);

  useEffect(() => {
    if (approved) {
      onDone({
        kind: "success",
        message: `${name}${DETAIL_SHEET_TOAST.approvedSuffix}`,
      });
    }
  }, [approved, name, onDone]);

  useEffect(() => {
    if (rejected) {
      onDone({
        kind: "success",
        message: `${name}${DETAIL_SHEET_TOAST.rejectedSuffix}`,
      });
    }
  }, [rejected, name, onDone]);

  useEffect(() => {
    if (blocked) {
      onDone({
        kind: "success",
        message: `${name}${DETAIL_SHEET_TOAST.blockedSuffix}`,
      });
    }
  }, [blocked, name, onDone]);

  const errors = [approveError, rejectError, blockError];
  const decided = errors.map(errorCodeOf).includes("already_decided");

  useEffect(() => {
    if (decided) {
      onDone({ kind: "info", message: DETAIL_SHEET_TOAST.alreadyDecided });
    }
  }, [decided, onDone]);

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
    sendApprove({ profileId });
  }, [sendApprove, profileId]);

  const confirm = useCallback(() => {
    if (face === "detail") {
      return;
    }

    const send = face === "reject" ? sendReject : sendBlock;

    send({ profileId });
  }, [face, profileId, sendReject, sendBlock]);

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
