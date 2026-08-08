import { listPositions } from "@/entities/position/api/list-positions";
import {
  createPosition,
  deletePosition,
  updatePosition,
} from "@/features/position/api/manage-positions";
import { AdminPositionsView } from "@/views/admin-positions/ui/AdminPositionsView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function AdminPositionsPage() {
  const positionsResult = await listPositions();

  if (!positionsResult.ok) {
    return <ErrorScreen />;
  }

  return (
    <AdminPositionsView
      positions={positionsResult.data}
      onCreate={createPosition}
      onUpdate={updatePosition}
      onDelete={deletePosition}
    />
  );
}
