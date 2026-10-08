import type { FontLoadingState } from "@/shared/model/font.type";

export function shouldRenderApp({ loaded, error }: FontLoadingState): boolean {
  return loaded || error !== null;
}

export function shouldDismissSplash(
  state: FontLoadingState,
  alreadyDismissed: boolean,
  themeRestored: boolean = true,
): boolean {
  return !alreadyDismissed && themeRestored && shouldRenderApp(state);
}
