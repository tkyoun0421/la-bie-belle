import { afterEach, describe, expect, it, vi } from "vitest";

import { yieldToMain } from "@/shared/lib/yield-to-main";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("yieldToMain", () => {
  it("scheduler.yield를 지원하면 해당 API를 사용한다", async () => {
    const schedulerYield = vi.fn(() => Promise.resolve());
    vi.stubGlobal("window", { scheduler: { yield: schedulerYield } });

    await yieldToMain();

    expect(schedulerYield).toHaveBeenCalledOnce();
  });

  it("scheduler.yield를 지원하지 않으면 MessageChannel로 양보한다", async () => {
    const closePort1 = vi.fn();
    const closePort2 = vi.fn();

    class FakeMessageChannel {
      static instance: FakeMessageChannel;

      port1 = {
        close: closePort1,
        onmessage: null as (() => void) | null,
      };

      port2 = {
        close: closePort2,
        postMessage: vi.fn(() => queueMicrotask(() => this.port1.onmessage?.())),
      };

      constructor() {
        FakeMessageChannel.instance = this;
      }
    }

    vi.stubGlobal("window", {});
    vi.stubGlobal("MessageChannel", FakeMessageChannel);

    await yieldToMain();

    expect(FakeMessageChannel.instance.port2.postMessage).toHaveBeenCalledWith(null);
    expect(closePort1).toHaveBeenCalledOnce();
    expect(closePort2).toHaveBeenCalledOnce();
  });
});
