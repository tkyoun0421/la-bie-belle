import { EmptyState } from "@/shared/ui/EmptyState";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";

export function WagesEmpty() {
  return (
    <EmptyState
      scene="no-members"
      title={WAGES_COPY.emptyTitle}
      description={WAGES_COPY.emptyBody}
    />
  );
}
