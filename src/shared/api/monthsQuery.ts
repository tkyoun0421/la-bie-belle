export type MonthsResult<Loaded> = {
  data: Loaded[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

type QueryResult = {
  data: unknown;
  isPending: boolean;
  error: Error | null;
};

export function combineMonths<Loaded>(
  results: readonly QueryResult[],
  months: readonly string[],
  monthAt: (at: number) => Loaded,
): MonthsResult<Loaded> {
  const loaded = results.every((result) => result.data !== undefined);

  return {
    data: loaded ? months.map((_month, at) => monthAt(at)) : undefined,
    isLoading: results.some((result) => result.isPending),
    error: results.find((result) => result.error !== null)?.error ?? null,
  };
}
