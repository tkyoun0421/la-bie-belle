type PageResult<T> = { data: T[] | null; error: unknown };

export async function readAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const received = data ?? [];
    rows.push(...received);

    if (received.length < pageSize) {
      return rows;
    }
  }
}
