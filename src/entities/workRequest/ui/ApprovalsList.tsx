import type { ReactNode } from "react";
import { FragmentView } from "@/shared/ui/FragmentView";
import {
  useApprovalRows,
  type ApprovalRowsInput,
} from "@/entities/workRequest/hooks/useApprovalRows";
import { ApprovalRows } from "@/entities/workRequest/ui/ApprovalRows";

export type ApprovalsListProps = ApprovalRowsInput & {
  pending?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function ApprovalsList({
  pending,
  failed,
  empty,
  ...input
}: ApprovalsListProps) {
  const fragment = useApprovalRows(input);

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={failed}
      empty={empty}
    >
      {(ready) => <ApprovalRows rows={ready.rows} />}
    </FragmentView>
  );
}
