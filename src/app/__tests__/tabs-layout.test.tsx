// eslint-disable-next-line project/no-comments
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import type { ReactElement } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const listNotifications = vi.fn();

vi.mock("@/entities/notification/api/list-notifications", () => ({ listNotifications }));

const NO_RESPONSE = Symbol("응답 없음");

function waitAtMost<T>(promise: Promise<T>, ms: number): Promise<T | typeof NO_RESPONSE> {
  return Promise.race([
    promise,
    new Promise<typeof NO_RESPONSE>((resolve) => setTimeout(() => resolve(NO_RESPONSE), ms)),
  ]);
}

afterEach(() => {
  cleanup();
  mockPathname = "/";
  listNotifications.mockReset();
});

describe("TabsLayout — listNotifications가 탭 트리를 막지 않는다 (인수 조건 24)", () => {
  it("listNotifications가 영원히 응답하지 않아도 헤더와 탭바가 그려진다", async () => {
    listNotifications.mockReturnValue(new Promise(() => {}));

    const { default: TabsLayout } = await import("@/app/(protected)/(tabs)/layout");

    const rendered = await waitAtMost(TabsLayout({ children: <p>본문</p>, sheet: null }), 50);

    expect(rendered).not.toBe(NO_RESPONSE);

    render(rendered as ReactElement);

    expect(screen.getByTestId("app-header-shell")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "주요 메뉴" })).toBeInTheDocument();
  });
});
