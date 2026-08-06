"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export type PreviewScenario = {
  label: string;
  node: ReactNode;
};

export type PreviewScreen = {
  label: string;
  scenarios: PreviewScenario[];
};

type PreviewViewProps = {
  screens: PreviewScreen[];
};

export function PreviewView({ screens }: PreviewViewProps) {
  const [screenLabel, setScreenLabel] = useState(screens[0]!.label);
  const screen = screens.find((entry) => entry.label === screenLabel) ?? screens[0]!;
  const [scenarioLabel, setScenarioLabel] = useState(screen.scenarios[0]!.label);
  const scenario =
    screen.scenarios.find((entry) => entry.label === scenarioLabel) ?? screen.scenarios[0]!;

  function handleScreenChange(label: string) {
    const nextScreen = screens.find((entry) => entry.label === label);
    setScreenLabel(label);
    setScenarioLabel(nextScreen?.scenarios[0]!.label ?? "");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-wrap gap-3 border-b border-border bg-surface p-3">
        <label className="flex items-center gap-2 typo-caption text-text">
          화면 선택
          <select
            aria-label="화면 선택"
            value={screenLabel}
            onChange={(event) => handleScreenChange(event.target.value)}
          >
            {screens.map((entry) => (
              <option key={entry.label} value={entry.label}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 typo-caption text-text">
          시나리오 선택
          <select
            aria-label="시나리오 선택"
            value={scenarioLabel}
            onChange={(event) => setScenarioLabel(event.target.value)}
          >
            {screen.scenarios.map((entry) => (
              <option key={entry.label} value={entry.label}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex-1">{scenario.node}</div>
    </div>
  );
}
