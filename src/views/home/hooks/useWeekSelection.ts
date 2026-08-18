"use client";

import { useState } from "react";

import type { WeekDay as HomeWeekDay } from "@/views/home/model/home-view-model";

export type WeekDay = HomeWeekDay;

export type UseWeekSelectionResult = {
  selectedDate: string | null;
  select: (date: string) => void;
};

export function useWeekSelection(week: readonly WeekDay[]): UseWeekSelectionResult {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function select(date: string) {
    const day = week.find((entry) => entry.date === date);
    if (!day || !day.hasShift) {
      return;
    }
    setSelectedDate((current) => (current === date ? null : date));
  }

  return { selectedDate, select };
}
