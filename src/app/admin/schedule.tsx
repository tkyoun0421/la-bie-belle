import { useLocalSearchParams } from "expo-router";
import { ScheduleAdminScreen } from "@/screens/scheduleAdmin/ui/ScheduleAdminScreen";

type ScheduleParams = {
  month?: string;
  date?: string;
  from?: string;
};

export default function Screen() {
  const { month, date, from } = useLocalSearchParams<ScheduleParams>();

  return <ScheduleAdminScreen month={month} date={date} from={from} />;
}
