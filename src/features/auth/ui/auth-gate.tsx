"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { useAuthGate, type AuthGateValue } from "@/features/auth/use-auth-gate";

const AuthGateContext = createContext<AuthGateValue | null>(null);

export function useAuthGateValue(): AuthGateValue {
  const value = useContext(AuthGateContext);

  if (!value) {
    throw new Error("게이트 값은 AuthGate 안에서만 읽는다.");
  }

  return value;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, destination, email, avatarUrl, retry } = useAuthGate();

  if (status === "loading") {
    return null;
  }

  if (status === "error") {
    return (
      <main className="flex flex-1 items-center justify-center bg-bg-neutral px-6 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
        <Button onClick={retry} className="h-12 w-full">
          다시 시도
        </Button>
      </main>
    );
  }

  return (
    <AuthGateContext.Provider value={{ destination, email, avatarUrl }}>
      {children}
    </AuthGateContext.Provider>
  );
}
