import { useLocalSearchParams } from "expo-router";
import { ScheduleWorkerScreen } from "@/screens/scheduleWorker/ui/ScheduleWorkerScreen";

type ScheduleParams = {
  month?: string;
  date?: string;
};

export default function Screen() {
  const { month, date } = useLocalSearchParams<ScheduleParams>();

  return <ScheduleWorkerScreen month={month} date={date} />;
}
