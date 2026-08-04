import { SERVER_ONLY_MARKER } from "@/shared/config/server-only.config";
import { BootstrapScreen } from "@/views/bootstrap/ui/BootstrapScreen";

export default function Page() {
  return <BootstrapScreen serverBoundaryReady={SERVER_ONLY_MARKER.length > 0} />;
}
