export type FontFamilyName =
  | "WantedSans-Regular"
  | "WantedSans-Medium"
  | "WantedSans-SemiBold"
  | "WantedSans-Bold";

export type FontLoadingState = {
  loaded: boolean;
  error: Error | null;
};
