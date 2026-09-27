import { useLocalSearchParams } from "expo-router";
import { ApplicationsScreen } from "@/screens/applications/ui/ApplicationsScreen";

type ApplicationsParams = {
  month?: string;
};

export default function Screen() {
  const { month } = useLocalSearchParams<ApplicationsParams>();

  return <ApplicationsScreen month={month} />;
}
