export type AddRehearsalInput = {
  workDate: string;
  startsAt?: string;
  endsAt?: string;
  count?: number;
};

export type EditRehearsalInput = {
  id: string;
  startsAt?: string;
  endsAt?: string;
  count?: number;
};
