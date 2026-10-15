import { jest } from "@jest/globals";

const { readAllPages } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/shared/api/readAllPages"
);

type Page = { data: number[] | null; error: unknown };

function rowsBetween(from: number, to: number, total: number): number[] {
  const last = Math.min(to, total - 1);
  return Array.from(
    { length: Math.max(0, last - from + 1) },
    (_, at) => from + at,
  );
}

function pagesOf(total: number) {
  return jest.fn(async (from: number, to: number): Promise<Page> => ({
    data: rowsBetween(from, to, total),
    error: null,
  }));
}

describe("readAllPages — 상한에 안 잘리고 끝까지 받는다", () => {
  it("2500행을 천 행씩 세 번 불러 순서대로 다 받는다", async () => {
    const page = pagesOf(2500);

    const rows = await readAllPages(page);

    expect(rows).toEqual(Array.from({ length: 2500 }, (_, at) => at));
    expect(page.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("정확히 천 행이면 한 번 더 불러 빈 페이지에서 멈춘다", async () => {
    const page = pagesOf(1000);

    const rows = await readAllPages(page);

    expect(rows).toHaveLength(1000);
    expect(page.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it("0행이면 한 번만 부른다", async () => {
    const page = pagesOf(0);

    const rows = await readAllPages(page);

    expect(rows).toEqual([]);
    expect(page).toHaveBeenCalledTimes(1);
  });

  it("pageSize를 주면 그 크기로 민다", async () => {
    const page = pagesOf(5);

    const rows = await readAllPages(page, 2);

    expect(rows).toEqual([0, 1, 2, 3, 4]);
    expect(page.mock.calls).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
  });

  it("error가 오면 그 error로 reject한다", async () => {
    const failure = new Error("읽기 실패");
    const page = jest.fn(async (): Promise<Page> => ({
      data: null,
      error: failure,
    }));

    await expect(readAllPages(page)).rejects.toBe(failure);
  });

  it("뒤쪽 페이지에서 error가 나도 reject한다", async () => {
    const failure = new Error("둘째 페이지 실패");
    const page = jest.fn(async (from: number): Promise<Page> =>
      from === 0
        ? { data: rowsBetween(0, 999, 5000), error: null }
        : { data: null, error: failure },
    );

    await expect(readAllPages(page)).rejects.toBe(failure);
  });

  it("data가 null이면 빈 배열로 친다", async () => {
    const page = jest.fn(async (): Promise<Page> => ({
      data: null,
      error: null,
    }));

    await expect(readAllPages(page)).resolves.toEqual([]);
  });
});
