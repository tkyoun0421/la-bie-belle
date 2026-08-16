"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "labiebelle:push-priming-shown";

function readAlreadyShown(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAlreadyShown(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    return;
  }
}

export function usePushPriming() {
  const [alreadyShown, setAlreadyShown] = useState(readAlreadyShown);

  const markShown = useCallback(() => {
    writeAlreadyShown();
    setAlreadyShown(true);
  }, []);

  return { alreadyShown, markShown };
}
