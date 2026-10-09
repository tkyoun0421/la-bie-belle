import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MEMBERS_COPY } from "@/screens/members/consts/members.const";

export function MembersEmpty() {
  return (
    <Card>
      <EmptyState
        scene="no-members"
        title={MEMBERS_COPY.emptyTitle}
        description={MEMBERS_COPY.emptyBody}
      />
    </Card>
  );
}
