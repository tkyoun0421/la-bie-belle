export type AuthDestination =
  "/login" | "/pending" | "/blocked" | "/left" | "/";

export type SessionUser = {
  id: string;
  email: string;
  googlePhotoUrl: string | null;
};
