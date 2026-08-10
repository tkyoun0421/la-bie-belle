"use client";

import { LazyMotion } from "motion/react";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export type MotionSpringTokens = {
  stiffness: number;
  damping: number;
};

const DEFAULT_SPRING_TOKENS: MotionSpringTokens = { stiffness: 400, damping: 30 };

const MotionTokensContext = createContext<MotionSpringTokens | null>(null);

export function useMotionTokens(): MotionSpringTokens {
  const tokens = useContext(MotionTokensContext);
  if (tokens === null) {
    throw new Error("useMotionTokens는 MotionProvider 아래에서만 호출할 수 있어요.");
  }
  return tokens;
}

let cachedSpringTokens: MotionSpringTokens | null = null;

function readSpringTokens(): MotionSpringTokens {
  if (cachedSpringTokens !== null) {
    return cachedSpringTokens;
  }

  const styles = getComputedStyle(document.documentElement);
  const stiffness = Number.parseFloat(styles.getPropertyValue("--spring-stiffness"));
  const damping = Number.parseFloat(styles.getPropertyValue("--spring-damping"));

  cachedSpringTokens = {
    stiffness: Number.isFinite(stiffness) ? stiffness : DEFAULT_SPRING_TOKENS.stiffness,
    damping: Number.isFinite(damping) ? damping : DEFAULT_SPRING_TOKENS.damping,
  };
  return cachedSpringTokens;
}

function subscribeToNothing() {
  return () => {};
}

function getServerSpringTokens(): MotionSpringTokens {
  return DEFAULT_SPRING_TOKENS;
}

function loadDomAnimationFeatures() {
  return import("motion/react").then((module) => module.domAnimation);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const tokens = useSyncExternalStore(subscribeToNothing, readSpringTokens, getServerSpringTokens);

  return (
    <LazyMotion strict features={loadDomAnimationFeatures}>
      <MotionTokensContext.Provider value={tokens}>{children}</MotionTokensContext.Provider>
    </LazyMotion>
  );
}
