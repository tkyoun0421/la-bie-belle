const TEN_THOUSAND = 10000;

export function tenThousandWonLabel(amount: number): string {
  return `${Math.round(amount / TEN_THOUSAND)}만`;
}
