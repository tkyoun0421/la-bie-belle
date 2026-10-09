import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ADMIN_HOME_PATH,
  ADMIN_SCHEDULE_PATH,
  ORIGIN_APPROVALS,
} from "@/shared/consts/navigation.const";
import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";

export type ApprovalsScreenController = {
  answered: string | null;
  sheet: PendingApproval | null;
  toast: string | null;
  goBack: () => void;
  openApproval: (approval: PendingApproval) => void;
  closeSheet: () => void;
  finishReject: () => void;
  finishApprove: () => void;
  dismissToast: () => void;
};

export function useApprovalsScreen(): ApprovalsScreenController {
  const router = useRouter();

  const [open, setOpen] = useState<PendingApproval | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const closeSheet = useCallback(() => setOpen(null), []);

  const finishReject = useCallback(() => {
    if (open === null) {
      return;
    }

    setAnswered(open.id);
    setOpen(null);
    setToast(APPROVALS_COPY.rejected);
  }, [open]);

  const finishApprove = useCallback(() => {
    if (open === null) {
      return;
    }

    setAnswered(open.id);
    setOpen(null);
    router.replace(
      `${ADMIN_SCHEDULE_PATH}?date=${open.workDate}&from=${ORIGIN_APPROVALS}`,
    );
  }, [open, router]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_HOME_PATH);
  }, [router]);

  return {
    answered,
    sheet: open,
    toast,
    goBack,
    openApproval: setOpen,
    closeSheet,
    finishReject,
    finishApprove,
    dismissToast: () => setToast(null),
  };
}
