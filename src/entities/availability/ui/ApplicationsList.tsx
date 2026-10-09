import type { ReactNode } from "react";
import {
  useApplicationsList,
  type ApplicationsListInput,
} from "@/entities/availability/hooks/useApplicationsList";
import { ApplicationsDateGroups } from "@/entities/availability/ui/ApplicationsDateGroups";
import { ApplicationsPersonGroups } from "@/entities/availability/ui/ApplicationsPersonGroups";

export type ApplicationsListProps = ApplicationsListInput & {
  loading?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function ApplicationsList({
  loading,
  failed,
  empty,
  ...input
}: ApplicationsListProps) {
  const fragment = useApplicationsList(input);

  if (fragment.state === "pending") {
    return loading ?? null;
  }

  if (fragment.state === "failed") {
    return failed ?? null;
  }

  if (fragment.state === "empty") {
    return empty ?? null;
  }

  if (fragment.state === "date") {
    return <ApplicationsDateGroups groups={fragment.dateGroups} />;
  }

  return <ApplicationsPersonGroups groups={fragment.personGroups} />;
}
