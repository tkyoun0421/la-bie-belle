import type { ReactNode } from "react";
import { FragmentView } from "@/shared/ui/FragmentView";
import {
  useApplicationsList,
  type ApplicationsListInput,
} from "@/entities/availability/hooks/useApplicationsList";
import { ApplicationsDateGroups } from "@/entities/availability/ui/ApplicationsDateGroups";
import { ApplicationsPersonGroups } from "@/entities/availability/ui/ApplicationsPersonGroups";

export type ApplicationsListProps = ApplicationsListInput & {
  pending?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function ApplicationsList({
  pending,
  failed,
  empty,
  ...input
}: ApplicationsListProps) {
  const fragment = useApplicationsList(input);

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={failed}
      empty={empty}
    >
      {(ready) =>
        ready.tab === "date" ? (
          <ApplicationsDateGroups groups={ready.dateGroups} />
        ) : (
          <ApplicationsPersonGroups groups={ready.personGroups} />
        )
      }
    </FragmentView>
  );
}
