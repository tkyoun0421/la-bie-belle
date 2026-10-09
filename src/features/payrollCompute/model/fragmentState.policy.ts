export type PayrollFragmentState = "pending" | "failed" | "ready";

export type FragmentRead = {
  data: unknown;
  error: Error | null;
};

export function fragmentStateOf(read: FragmentRead): PayrollFragmentState {
  if (read.error !== null) {
    return "failed";
  }

  return read.data === undefined ? "pending" : "ready";
}
