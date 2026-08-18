// eslint-disable-next-line project/no-comments
// @vitest-environment jsdom
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Providers } from "@/app/(protected)/providers";

afterEach(cleanup);

function ClientProbe({ onClient }: { onClient: (client: QueryClient) => void }) {
  const client = useQueryClient();
  onClient(client);
  return <p>탐침</p>;
}

describe("Providers", () => {
  it("children을 그대로 렌더한다", () => {
    render(
      <Providers>
        <p>본문</p>
      </Providers>,
    );

    expect(screen.getByText("본문")).toBeInTheDocument();
  });

  it("자식이 useQueryClient()로 QueryClient 인스턴스를 실제로 받는다", () => {
    const onClient = vi.fn<(client: QueryClient) => void>();

    render(
      <Providers>
        <ClientProbe onClient={onClient} />
      </Providers>,
    );

    expect(onClient).toHaveBeenCalledOnce();
    expect(onClient.mock.calls[0]?.[0]).toBeInstanceOf(QueryClient);
  });

  it("리렌더해도 같은 QueryClient 인스턴스를 유지한다", () => {
    const onClient = vi.fn<(client: QueryClient) => void>();

    const { rerender } = render(
      <Providers>
        <ClientProbe onClient={onClient} />
      </Providers>,
    );

    rerender(
      <Providers>
        <ClientProbe onClient={onClient} />
      </Providers>,
    );

    expect(onClient).toHaveBeenCalledTimes(2);
    const firstClient = onClient.mock.calls[0]?.[0];
    const secondClient = onClient.mock.calls[1]?.[0];
    expect(secondClient).toBe(firstClient);
  });
});
