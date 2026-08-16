"use client";

import { useCallback, useEffect, useState } from "react";

import { resolvePushSupportState, type PushSupportState } from "@/features/push/model/push-support";

const SERVICE_WORKER_SCOPE = "/";
const SERVICE_WORKER_PATH = "/push-service-worker.js";

export type PushSubscriptionOutcome = { ok: true } | { ok: false };

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function detectPushApiSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function detectIsIos(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function detectIsStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (navigator as NavigatorWithStandalone).standalone === true;
  return displayModeStandalone || iosStandalone;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [pushApiSupported] = useState(detectPushApiSupported);
  const [isIos] = useState(detectIsIos);
  const [isStandalone] = useState(() => (detectPushApiSupported() ? detectIsStandalone() : false));
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    detectPushApiSupported() ? Notification.permission : "default",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!pushApiSupported) {
      return;
    }

    let cancelled = false;

    async function registerAndSync() {
      try {
        const nextRegistration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: SERVICE_WORKER_SCOPE,
          updateViaCache: "none",
        });
        if (cancelled) {
          return;
        }
        setRegistration(nextRegistration);
        const existing = await nextRegistration.pushManager.getSubscription();
        if (cancelled) {
          return;
        }
        setSubscribed(existing !== null);
      } catch {
        if (!cancelled) {
          setRegistration(null);
        }
      }
    }

    void registerAndSync();

    return () => {
      cancelled = true;
    };
  }, [pushApiSupported]);

  const status: PushSupportState = resolvePushSupportState({
    pushApiSupported,
    isIos,
    isStandalone,
    permission,
    subscribed,
  });

  const subscribe = useCallback(async (): Promise<PushSubscriptionOutcome> => {
    if (!pushApiSupported) {
      return { ok: false };
    }
    setPending(true);
    try {
      const grantedPermission = await Notification.requestPermission();
      setPermission(grantedPermission);
      if (grantedPermission !== "granted") {
        return { ok: false };
      }

      const activeRegistration = registration ?? (await navigator.serviceWorker.ready);
      const { env } = await import("@/shared/config/env.client");
      const subscription = await activeRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        ) as BufferSource,
      });
      const json = subscription.toJSON();
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (json.endpoint === undefined || p256dh === undefined || auth === undefined) {
        return { ok: false };
      }

      const { savePushSubscription } = await import("@/features/push/api/save-push-subscription");
      const result = await savePushSubscription({ endpoint: json.endpoint, p256dh, auth });
      if (!result.ok) {
        return { ok: false };
      }
      setRegistration(activeRegistration);
      setSubscribed(true);
      return { ok: true };
    } finally {
      setPending(false);
    }
  }, [pushApiSupported, registration]);

  const unsubscribe = useCallback(async (): Promise<PushSubscriptionOutcome> => {
    if (registration === null) {
      return { ok: false };
    }
    setPending(true);
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription !== null) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        const { removePushSubscription } =
          await import("@/features/push/api/remove-push-subscription");
        await removePushSubscription({ endpoint });
      }
      setSubscribed(false);
      return { ok: true };
    } finally {
      setPending(false);
    }
  }, [registration]);

  return { status, pending, subscribe, unsubscribe };
}
