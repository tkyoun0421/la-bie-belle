import { jest } from "@jest/globals";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DomainError, TransportError } from "@/shared/api/errors";
import { checkIn } from "@/entities/attendance/dals/check-in";

const PARAMS = {
  dayId: "day-1",
  reportedAt: "2026-09-10T01:00:00.000Z",
  method: "location" as const,
  lat: 37.5,
  lng: 127.0,
};

function fakeClient(
  rpc: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>,
): SupabaseClient {
  return { rpc: jest.fn(rpc) } as unknown as SupabaseClient;
}

describe("checkIn dal — TransportError면 재시도하고 DomainError면 즉시 실패한다(AC-07)", () => {
  it("check_in RPC를 부른다", async () => {
    // 인자를 받는 꼴로 적어야 mock.calls 가 빈 튜플이 아니라 인자 배열로 잡힌다.
    const rpc = jest.fn(async (..._args: unknown[]) => ({
      data: null,
      error: null,
    }));
    const client = { rpc } as unknown as SupabaseClient;

    await checkIn(PARAMS, { client, wait: async () => {} });

    expect(rpc.mock.calls[0]?.[0]).toBe("check_in");
  });

  it("DomainError면 재시도 없이 즉시 실패한다", async () => {
    const client = fakeClient(async () => ({
      data: null,
      error: { message: "not_allowed" },
    }));
    const wait = jest.fn(async () => {});

    await expect(checkIn(PARAMS, { client, wait })).rejects.toBeInstanceOf(
      DomainError,
    );
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });

  it("TransportError면 다섯 번 더 시도해 총 여섯 번 부른다 — 큐에 넘기지 않고 이 호출 안에서 전부 끝낸다", async () => {
    const client = fakeClient(async () => ({
      data: null,
      error: { message: "network error" },
    }));
    const wait = jest.fn(async () => {});

    await expect(checkIn(PARAMS, { client, wait })).rejects.toBeInstanceOf(
      TransportError,
    );
    expect(client.rpc).toHaveBeenCalledTimes(6);
  });

  it("재시도 간격이 2·4·8·16·32초 지수 백오프다", async () => {
    const client = fakeClient(async () => ({
      data: null,
      error: { message: "network error" },
    }));
    const waited: unknown[] = [];
    const wait = jest.fn(async (ms: unknown) => {
      waited.push(ms);
    });

    await expect(checkIn(PARAMS, { client, wait })).rejects.toBeInstanceOf(
      TransportError,
    );
    expect(waited).toEqual([2000, 4000, 8000, 16000, 32000]);
  });

  it("재시도 도중 성공하면 그 결과로 끝나고 더 부르지 않는다", async () => {
    let attempt = 0;
    const client = fakeClient(async () => {
      attempt += 1;
      if (attempt < 3) {
        return { data: null, error: { message: "network error" } };
      }
      return { data: null, error: null };
    });
    const wait = jest.fn(async () => {});

    await expect(checkIn(PARAMS, { client, wait })).resolves.toBeUndefined();
    expect(client.rpc).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });
});
