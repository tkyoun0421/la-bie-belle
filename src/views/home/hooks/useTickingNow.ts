"use client";

import { useEffect, useState } from "react";

export function useTickingNow(base: Date, active: boolean): Date {
  const [prevBase, setPrevBase] = useState(base);
  const [now, setNow] = useState(base);

  if (base !== prevBase) {
    setPrevBase(base);
    setNow(base);
  }

  useEffect(() => {
    if (!active) {
      return;
    }

    const anchor = Date.now();
    const baseMs = base.getTime();
    const id = setInterval(() => {
      setNow(new Date(baseMs + (Date.now() - anchor)));
    }, 1000);

    return () => clearInterval(id);
  }, [active, base]);

  return now;
}
