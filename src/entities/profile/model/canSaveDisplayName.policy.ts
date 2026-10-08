export function canSaveDisplayName(current: string, next: string): boolean {
  const trimmed = next.trim();

  return trimmed !== "" && trimmed !== current.trim();
}
