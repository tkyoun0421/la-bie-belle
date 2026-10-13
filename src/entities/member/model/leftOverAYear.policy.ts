export function isLeftOverAYear(leftAt: string, today: string): boolean {
  const anniversary = new Date(Date.parse(leftAt));
  anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);

  return Date.parse(today) >= anniversary.getTime();
}
