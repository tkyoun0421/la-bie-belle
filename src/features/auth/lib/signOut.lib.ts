export type SignOutDeps = {
  removePushToken: () => Promise<void>;
  signOut: () => Promise<void>;
  clearQueryClient: () => void;
  clearPersistedState: () => Promise<void>;
};

export async function signOut(deps: SignOutDeps): Promise<void> {
  await deps.removePushToken();
  await deps.signOut();
  deps.clearQueryClient();
  await deps.clearPersistedState();
}

export const DEVICE_CLEANUP_NOT_WIRED_YET = {
  removePushToken: async (): Promise<void> => {},
  clearPersistedState: async (): Promise<void> => {},
};
