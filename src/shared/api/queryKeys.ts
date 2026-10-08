function monthOf(value: string): string {
  return value.slice(0, 7);
}

export const queryKeys = {
  schedule: {
    all: ["schedule"],
    month: (month: string) => ["schedule", month],
    monthWindow: (month: string) => ["schedule", month, "window"],
    openSlots: (month: string) => ["schedule", month, "open-slots"],
    firstMonth: () => ["schedule", "first-month"],
  },
  availability: {
    all: ["availability"],
    mine: (month: string) => ["availability", month],
    everyone: (month: string) => ["availability", month, "all"],
  },
  attendance: {
    all: ["attendance"],
    day: (workDate: string) => ["attendance", workDate],
    month: (month: string) => ["attendance", monthOf(month)],
  },
  excuse: {
    month: (month: string) => ["excuses", month],
  },
  request: {
    all: ["requests"],
    month: (month: string) => ["requests", month],
    approvals: () => ["requests", "approvals"],
  },
  hall: {
    all: ["hall"],
    qr: () => ["hall", "qr"],
  },
  member: {
    all: ["members"],
    list: (kind: string) => ["members", kind],
    qualifications: () => ["members", "qualifications"],
  },
  session: {
    all: ["session"],
    user: () => ["session", "user"],
  },
  profile: {
    all: ["profile"],
    private: () => ["profile", "private"],
    privateOf: (profileId: string) => ["profile", "private", profileId],
  },
  notification: {
    all: ["notifications"],
    unread: () => ["notifications", "unread"],
  },
  payroll: {
    all: ["payroll"],
    month: (month: string) => ["payroll", monthOf(month)],
    wages: () => ["payroll", "wages"],
  },
  rehearsal: {
    all: ["rehearsal"],
    mine: (month: string) => ["rehearsal", month],
    everyone: (month: string) => ["rehearsal", month, "all"],
  },
} as const;

export const staleTogether = {
  scheduleWrite: [
    queryKeys.schedule.all,
    queryKeys.payroll.all,
    queryKeys.request.all,
  ],
  rehearsalWrite: [queryKeys.rehearsal.all, queryKeys.payroll.all],
} as const;
