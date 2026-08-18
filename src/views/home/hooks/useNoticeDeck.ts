"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "labiebelle:home-notice-deck";

export type NoticeDeckPhase = "idle" | "entering";

export type UseNoticeDeckResult = {
  currentId: string | null;
  leavingId: string | null;
  remainingCount: number;
  phase: NoticeDeckPhase;
  dismiss: () => void;
  settle: () => void;
};

type Listener = () => void;

type DismissedIdsStore = {
  getSnapshot: () => ReadonlySet<string> | null;
  getServerSnapshot: () => ReadonlySet<string> | null;
  subscribe: (listener: Listener) => () => void;
  hydrate: () => void;
  commit: (next: ReadonlySet<string>) => void;
};

function storageKey(today: string): string {
  return `${STORAGE_KEY_PREFIX}:${today}`;
}

function readDismissedIds(today: string): ReadonlySet<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(storageKey(today));
    if (raw === null) {
      return new Set();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeDismissedIds(today: string, ids: ReadonlySet<string>): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey(today), JSON.stringify(Array.from(ids)));
  } catch {
    return;
  }
}

function createDismissedIdsStore(today: string): DismissedIdsStore {
  let snapshot: ReadonlySet<string> | null = null;
  let hydrated = false;
  const listeners = new Set<Listener>();

  function notify() {
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot() {
      return snapshot;
    },
    getServerSnapshot() {
      return null;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hydrate() {
      if (hydrated) {
        return;
      }
      hydrated = true;
      snapshot = readDismissedIds(today);
      notify();
    },
    commit(next) {
      hydrated = true;
      snapshot = next;
      notify();
    },
  };
}

export function useNoticeDeck(noticeIds: readonly string[], today: string): UseNoticeDeckResult {
  const store = useMemo(() => createDismissedIdsStore(today), [today]);
  const dismissedIds = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const [phase, setPhase] = useState<NoticeDeckPhase>("idle");
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const transitioningRef = useRef(false);

  useEffect(() => {
    store.hydrate();
  }, [store]);

  const remaining = dismissedIds === null ? [] : noticeIds.filter((id) => !dismissedIds.has(id));
  const currentId = remaining[0] ?? null;

  function dismiss() {
    if (transitioningRef.current || currentId === null || dismissedIds === null) {
      return;
    }
    transitioningRef.current = true;
    const next = new Set(dismissedIds);
    next.add(currentId);
    writeDismissedIds(today, next);
    store.commit(next);
    setLeavingId(currentId);
    setPhase("entering");
  }

  function settle() {
    transitioningRef.current = false;
    setLeavingId(null);
    setPhase("idle");
  }

  return { currentId, leavingId, remainingCount: remaining.length, phase, dismiss, settle };
}
