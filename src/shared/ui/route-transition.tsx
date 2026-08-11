import { ViewTransition } from "react";
import type { ReactNode } from "react";

type RouteTransitionProps = {
  children: ReactNode;
};

export function RouteTransition({ children }: RouteTransitionProps) {
  return (
    <ViewTransition
      enter={{
        tab: "route-fade-in",
        "nav-forward": "route-slide-up",
        "nav-back": "route-fade-in",
        default: "none",
      }}
      exit={{
        tab: "route-fade-out",
        "nav-forward": "route-fade-out",
        "nav-back": "route-slide-down",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
