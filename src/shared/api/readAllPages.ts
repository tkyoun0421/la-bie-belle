type PageResult<T> = { data: T[] | null; error: unknown };

export async function readAllPages<T, K>(
  page: (after: K | null, limit: number) => PromiseLike<PageResult<T>>,
  keyOf: (row: T) => K,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  let after: K | null = null;

  for (;;) {
    const { data, error } = await page(after, pageSize);

    if (error) {
      throw error;
    }

    const received = data ?? [];
    rows.push(...received);

    const last = received.at(-1);
    if (received.length < pageSize || last === undefined) {
      return rows;
    }
    after = keyOf(last);
  }
}
