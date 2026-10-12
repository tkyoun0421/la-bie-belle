export type MutationCallbacks = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};
