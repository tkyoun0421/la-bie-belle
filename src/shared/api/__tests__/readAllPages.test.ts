import { jest } from "@jest/globals";

type Row = { id: number };
type Page = { data: Row[] | null; error: unknown };
type ReadAllPages = (
  page: (after: number | null, limit: number) => PromiseLike<Page>,
  keyOf: (row: Row) => number,
  pageSize?: number,
) => Promise<Row[]>;

function isReadAllPages(value: unknown): value is ReadAllPages {
  return typeof value === "function";
}

async function loadReadAllPages(): Promise<ReadAllPages> {
  const loaded: unknown = (await import("@/shared/api/readAllPages"))
    .readAllPages;
  if (!isReadAllPages(loaded)) {
    throw new Error("readAllPages를 찾지 못했다");
  }
  return loaded;
}

function tableOf(total: number): Row[] {
  return Array.from({ length: total }, (_, at) => ({ id: at + 1 }));
}

function pagerOver(table: Row[], afterRead?: (callNo: number) => void) {
  let callNo = 0;
  return jest.fn(async (after: number | null, limit: number): Promise<Page> => {
    const data = table
      .filter((row) => after === null || row.id > after)
      .sort((a, b) => a.id - b.id)
      .slice(0, limit);
    callNo += 1;
    if (callNo > 20) {
      throw new Error("호출이 끝나지 않는다");
    }
    afterRead?.(callNo);
    return { data, error: null };
  });
}

const idOf = (row: Row) => row.id;

describe("readAllPages — 키 커서로 끝까지 받는다", () => {
  it("페이지 사이에 앞쪽 행이 지워져도 남은 행이 하나도 안 빠진다", async () => {
    const readAllPages = await loadReadAllPages();
    const table = tableOf(8);
    const page = pagerOver(table, (callNo) => {
      if (callNo === 1) {
        table.splice(0, 2);
      }
    });

    const rows = await readAllPages(page, idOf, 3);

    expect(rows.map(idOf).filter((id) => id > 3)).toEqual([4, 5, 6, 7, 8]);
  });

  it("페이지 사이에 뒤쪽에 행이 끼어도 같은 행이 두 번 안 온다", async () => {
    const readAllPages = await loadReadAllPages();
    const table = tableOf(6);
    const page = pagerOver(table, (callNo) => {
      if (callNo === 1) {
        table.push({ id: 7 });
      }
    });

    const rows = await readAllPages(page, idOf, 3);

    const ids = rows.map(idOf);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("첫 호출 after는 null이다", async () => {
    const readAllPages = await loadReadAllPages();
    const page = pagerOver(tableOf(1));

    await readAllPages(page, idOf, 3);

    expect(page.mock.calls[0]).toEqual([null, 3]);
  });

  it("둘째 호출 after는 첫 페이지 마지막 행의 키, limit은 pageSize다", async () => {
    const readAllPages = await loadReadAllPages();
    const page = pagerOver(tableOf(5));

    await readAllPages(page, idOf, 2);

    expect(page.mock.calls[1]).toEqual([2, 2]);
    expect(page.mock.calls[2]).toEqual([4, 2]);
  });

  it("pageSize를 안 주면 천 행씩 받아 2500행을 순서대로 다 받는다", async () => {
    const readAllPages = await loadReadAllPages();
    const page = pagerOver(tableOf(2500));

    const rows = await readAllPages(page, idOf);

    expect(rows).toHaveLength(2500);
    expect(rows.map(idOf).join(",") === tableOf(2500).map(idOf).join(",")).toBe(
      true,
    );
    expect(page.mock.calls.map(([, limit]) => limit)).toEqual([
      1000, 1000, 1000,
    ]);
  });

  it("정확히 pageSize 배수면 빈 마지막 페이지에서 멈춘다", async () => {
    const readAllPages = await loadReadAllPages();
    const page = pagerOver(tableOf(4));

    const rows = await readAllPages(page, idOf, 2);

    expect(rows).toHaveLength(4);
    expect(page.mock.calls).toEqual([
      [null, 2],
      [2, 2],
      [4, 2],
    ]);
  });

  it("0행이면 한 번만 부른다", async () => {
    const readAllPages = await loadReadAllPages();
    const page = pagerOver([]);

    const rows = await readAllPages(page, idOf, 2);

    expect(rows).toEqual([]);
    expect(page).toHaveBeenCalledTimes(1);
  });

  it("error가 오면 그 error로 reject한다", async () => {
    const readAllPages = await loadReadAllPages();
    const failure = new Error("읽기 실패");
    const page = jest.fn(async (): Promise<Page> => ({
      data: null,
      error: failure,
    }));

    await expect(readAllPages(page, idOf, 2)).rejects.toBe(failure);
  });

  it("뒤쪽 페이지에서 error가 나도 reject한다", async () => {
    const readAllPages = await loadReadAllPages();
    const failure = new Error("둘째 페이지 실패");
    const page = jest.fn(async (after: number | null): Promise<Page> =>
      after === null
        ? { data: [{ id: 1 }, { id: 2 }], error: null }
        : { data: null, error: failure },
    );

    await expect(readAllPages(page, idOf, 2)).rejects.toBe(failure);
  });

  it("data가 null이면 빈 배열로 친다", async () => {
    const readAllPages = await loadReadAllPages();
    let calls = 0;
    const page = jest.fn(async (): Promise<Page> => {
      calls += 1;
      if (calls > 20) {
        throw new Error("호출이 끝나지 않는다");
      }
      return { data: null, error: null };
    });

    await expect(readAllPages(page, idOf, 2)).resolves.toEqual([]);
  });
});
