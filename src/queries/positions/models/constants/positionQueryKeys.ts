export const positionQueryKeys = {
  all: ["positions"] as const,
  collection: () => [...positionQueryKeys.all, "collection"] as const,
  detail: (positionId: string) =>
    [...positionQueryKeys.all, "detail", positionId] as const,
};
