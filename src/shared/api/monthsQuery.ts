export type MonthsResult<Loaded> = {
  data: Loaded[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

type QueryResult<Data> = {
  data: Data | undefined;
  isPending: boolean;
  error: Error | null;
};

function arrivedData<Data>(
  results: readonly QueryResult<Data>[],
): Data[] | null {
  const arrived: Data[] = [];

  for (const result of results) {
    if (result.data === undefined) {
      return null;
    }

    arrived.push(result.data);
  }

  return arrived;
}

export function combineMonths<Loaded, Data>(
  results: readonly QueryResult<Data>[],
  months: readonly string[],
  monthAt: (at: number, arrived: readonly Data[]) => Loaded,
): MonthsResult<Loaded> {
  const arrived = arrivedData(results);

  return {
    data:
      arrived === null
        ? undefined
        : months.map((_month, at) => monthAt(at, arrived)),
    isLoading: results.some((result) => result.isPending),
    error: results.find((result) => result.error !== null)?.error ?? null,
  };
}
