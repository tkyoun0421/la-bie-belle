import { useLocalSearchParams } from "expo-router";
import { NotificationsScreen } from "@/screens/notifications/ui/NotificationsScreen";

type NotificationsParams = {
  from?: string;
};

export default function Screen() {
  const { from } = useLocalSearchParams<NotificationsParams>();

  return <NotificationsScreen from={from} />;
}
