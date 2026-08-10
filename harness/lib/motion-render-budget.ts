import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "@playwright/test";
import type { Violation } from "./violation.ts";

const GATE = "gate:motion-render-budget";

export const RENDER_BUDGET_MS = 16;
export const STATIC_CHUNK_DIRECTORY = ".next/static/chunks";
export const NOTIFICATION_ITEM_COUNT = 3;
const WARMUP_TRIAL_COUNT = 2;
const SAMPLE_TRIAL_COUNT = 5;

export type RenderBudgetMeasurement = {
  readonly fullMotionMs: number;
  readonly reducedMotionMs: number;
};

function listCssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listCssFiles(path);
    }
    return entry.isFile() && entry.name.endsWith(".css") ? [path] : [];
  });
}

export function readBuiltCss(root: string): string | null {
  const directory = join(root, STATIC_CHUNK_DIRECTORY);
  if (!existsSync(directory)) {
    return null;
  }
  const files = listCssFiles(directory);
  if (files.length === 0) {
    return null;
  }
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

function buildNotificationListMarkup(itemCount: number): string {
  const rows = Array.from(
    { length: itemCount },
    (_, index) =>
      `<div class="motion-stagger-item" style="--stagger-index:${index}"><span>알림 ${index + 1}</span><span>본문 텍스트가 여기에 옵니다</span></div>`,
  ).join("");
  return `<div id="root">${rows}</div>`;
}

function buildFixtureDocument(css: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${css}</style></head><body></body></html>`;
}

function buildMountProbe(markup: string): string {
  return `(async () => {
    document.body.innerHTML = ${JSON.stringify(markup)};
    const start = performance.now();
    document.body.offsetHeight;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return performance.now() - start;
  })()`;
}

const RESET_BODY_PROBE = 'document.body.innerHTML = ""';

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  }
  return sorted[middle] ?? 0;
}

async function measureListMountMs(
  browser: Browser,
  css: string,
  reducedMotion: "reduce" | "no-preference",
): Promise<number> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion });
    await page.setContent(buildFixtureDocument(css));
    const markup = buildNotificationListMarkup(NOTIFICATION_ITEM_COUNT);
    const probe = buildMountProbe(markup);

    const samples: number[] = [];
    for (let trial = 0; trial < WARMUP_TRIAL_COUNT + SAMPLE_TRIAL_COUNT; trial += 1) {
      const elapsedMs = await page.evaluate<number>(probe);
      await page.evaluate(RESET_BODY_PROBE);
      if (trial >= WARMUP_TRIAL_COUNT) {
        samples.push(elapsedMs);
      }
    }
    return median(samples);
  } finally {
    await context.close();
  }
}

export async function measureRenderBudget(root: string): Promise<RenderBudgetMeasurement | null> {
  const css = readBuiltCss(root);
  if (css === null) {
    return null;
  }

  const browser = await chromium.launch();
  try {
    const fullMotionMs = await measureListMountMs(browser, css, "no-preference");
    const reducedMotionMs = await measureListMountMs(browser, css, "reduce");
    return { fullMotionMs, reducedMotionMs };
  } finally {
    await browser.close();
  }
}

export function evaluateRenderBudget(
  measurement: RenderBudgetMeasurement,
  budgetMs: number = RENDER_BUDGET_MS,
): Violation[] {
  const diffMs = Math.abs(measurement.fullMotionMs - measurement.reducedMotionMs);
  if (diffMs <= budgetMs) {
    return [];
  }

  return [
    {
      gate: GATE,
      file: "src/views/notifications/ui/NotificationsView.tsx",
      message: `reduced-motion 대비 렌더 시간 차이가 ${diffMs.toFixed(1)}ms로 상한 ${budgetMs}ms를 넘었습니다 (전체 모션 ${measurement.fullMotionMs.toFixed(1)}ms / reduced-motion ${measurement.reducedMotionMs.toFixed(1)}ms).`,
      hint: "순차 등장이 CSS animation-delay 밖에서 메인 스레드 비용을 추가로 만들지 않는지 확인하세요.",
    },
  ];
}

export async function runMotionRenderBudgetGate(root: string): Promise<Violation[]> {
  const measurement = await measureRenderBudget(root);
  if (measurement === null) {
    return [
      {
        gate: GATE,
        file: STATIC_CHUNK_DIRECTORY,
        message: "빌드 산출물에서 CSS를 찾지 못해 렌더 시간을 측정할 수 없습니다.",
        hint: "pnpm build를 먼저 실행하세요.",
      },
    ];
  }
  return evaluateRenderBudget(measurement);
}
