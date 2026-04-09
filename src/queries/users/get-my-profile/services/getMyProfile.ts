export type MyProfile = {
  id: string;
  name: string;
  role: "admin" | "manager" | "member";
};

export async function getMyProfile(): Promise<MyProfile | null> {
  return null;
}
