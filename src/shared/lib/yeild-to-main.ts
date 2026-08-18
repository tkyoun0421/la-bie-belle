export const yieldToMain = (): Promise<void> => {
  if ("scheduler" in window && typeof (window as any).scheduler?.yield === "function") {
    return (window as any).scheduler.yield();
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(null);
  });
};
