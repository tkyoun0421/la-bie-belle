import type { ApplicationsScreenController } from "@/screens/applications/hooks/useApplicationsScreen";
import { ApplicationsDateGroups } from "@/screens/applications/ui/ApplicationsDateGroups";
import { ApplicationsEmpty } from "@/screens/applications/ui/ApplicationsEmpty";
import { ApplicationsLoading } from "@/screens/applications/ui/ApplicationsLoading";
import { ApplicationsPersonGroups } from "@/screens/applications/ui/ApplicationsPersonGroups";

export type ApplicationsListProps = {
  screen: ApplicationsScreenController;
};

export function ApplicationsList({ screen }: ApplicationsListProps) {
  if (screen.listState === "loading") {
    return <ApplicationsLoading />;
  }

  if (screen.listState === "empty") {
    return <ApplicationsEmpty deadlineLine={screen.emptyDeadlineLine} />;
  }

  if (screen.listState === "date") {
    return <ApplicationsDateGroups groups={screen.dateGroups} />;
  }

  return <ApplicationsPersonGroups groups={screen.personGroups} />;
}
