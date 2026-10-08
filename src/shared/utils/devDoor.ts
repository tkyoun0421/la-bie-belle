export function isDevDoorOpen(isDev: boolean): boolean {
  return isDev;
}

let profileReadFailureArmed = false;

export function armProfileReadFailure(): void {
  profileReadFailureArmed = true;
}

export function takeProfileReadFailure(): boolean {
  const armed = profileReadFailureArmed;

  profileReadFailureArmed = false;

  return armed;
}
