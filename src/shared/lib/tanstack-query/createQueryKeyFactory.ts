type QueryKeyValue = string | number | boolean | null | Record<string, unknown>;

type QueryKeyPrefix = readonly [string, ...string[]];

export function createQueryKeyFactory<const TPrefix extends QueryKeyPrefix>(
  ...prefix: TPrefix
) {
  return {
    all: prefix,
    collections: () => [...prefix, "collection"] as const,
    collection: <TFilter extends QueryKeyValue | undefined = undefined>(
      filter?: TFilter
    ) =>
      filter === undefined
        ? ([...prefix, "collection"] as const)
        : ([...prefix, "collection", filter] as const),
    details: () => [...prefix, "detail"] as const,
    detail: <TDetail extends QueryKeyValue>(detail: TDetail) =>
      [...prefix, "detail", detail] as const,
  };
}
