import { listPendingProfiles } from "@/entities/identity/api/list-pending-profiles";
import { approveSignup } from "@/features/approval/api/approve-signup";
import { rejectSignup } from "@/features/approval/api/reject-signup";
import { ApprovalListView } from "@/views/admin/ui/ApprovalListView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function AdminApprovalsPage() {
  const profilesResult = await listPendingProfiles();

  if (!profilesResult.ok) {
    return <ErrorScreen />;
  }

  return (
    <ApprovalListView
      profiles={profilesResult.data}
      onApprove={approveSignup}
      onReject={rejectSignup}
    />
  );
}
