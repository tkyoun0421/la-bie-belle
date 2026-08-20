interface YieldScheduler {
  yield(): Promise<void>;
}

const isYieldScheduler = (value: unknown): value is YieldScheduler => {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    return false;
  }

  return "yield" in value && typeof value.yield === "function";
};

export const yieldToMain = (): Promise<void> => {
  const scheduler = "scheduler" in window ? window.scheduler : undefined;

  if (isYieldScheduler(scheduler)) {
    return scheduler.yield();
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();

    channel.port1.onmessage = () => {
      channel.port1.close();
      channel.port2.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });
};
