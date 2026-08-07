export function toggleRecruitmentDate(
  selectedDates: ReadonlySet<string>,
  dateKey: string,
): ReadonlySet<string> {
  const next = new Set(selectedDates);
  if (next.has(dateKey)) {
    next.delete(dateKey);
  } else {
    next.add(dateKey);
  }
  return next;
}

export function earliestRecruitmentDate(selectedDates: ReadonlySet<string>): string | null {
  let earliest: string | null = null;
  for (const date of selectedDates) {
    if (earliest === null || date < earliest) {
      earliest = date;
    }
  }
  return earliest;
}
