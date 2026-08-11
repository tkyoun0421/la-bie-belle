import { listPendingProfiles } from "@/entities/identity/api/list-pending-profiles";
import { approveSignup } from "@/features/approval/api/approve-signup";
import { rejectSignup } from "@/features/approval/api/reject-signup";
import { RouteTransition } from "@/shared/ui/route-transition";
import { ApprovalListView } from "@/views/admin/ui/ApprovalListView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function AdminApprovalsPage() {
  const profilesResult = await listPendingProfiles();

  if (!profilesResult.ok) {
    return <ErrorScreen />;
  }

  return (
    <RouteTransition>
      <ApprovalListView
        profiles={profilesResult.data}
        onApprove={approveSignup}
        onReject={rejectSignup}
      />
    </RouteTransition>
  );
}
