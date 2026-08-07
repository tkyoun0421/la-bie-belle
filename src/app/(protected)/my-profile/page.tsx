import { findOwnWorkerInfo } from "@/entities/identity/api/find-own-worker-info";
import { setOwnWage } from "@/features/my-profile/api/set-own-wage";
import { updateOwnPhone } from "@/features/my-profile/api/update-own-phone";
import { MyProfileView } from "@/views/my-profile/ui/MyProfileView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function MyProfilePage() {
  const infoResult = await findOwnWorkerInfo();

  if (!infoResult.ok) {
    return <ErrorScreen />;
  }

  return (
    <MyProfileView info={infoResult.data} onUpdatePhone={updateOwnPhone} onSetWage={setOwnWage} />
  );
}
