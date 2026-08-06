import { signInWithGoogle } from "@/features/auth/api/sign-in-with-google";
import { LoginView } from "@/views/login/ui/LoginView";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <LoginView hasAuthError={error === "auth"} onSignIn={signInWithGoogle} />;
}
