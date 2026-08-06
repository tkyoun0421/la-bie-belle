"use client";

import { useRouter } from "next/navigation";

import { ScheduleView } from "@/views/schedule/ui/ScheduleView";
import { SCHEDULE_MIXED_MONTH } from "@/views/schedule/ui/schedule.mock";

export default function SchedulePage() {
  const router = useRouter();

  return (
    <ScheduleView
      {...SCHEDULE_MIXED_MONTH}
      onOpenDetail={(date) => router.push(`/schedule/${date}`)}
    />
  );
}
