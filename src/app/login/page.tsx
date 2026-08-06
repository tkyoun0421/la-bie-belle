import { signInWithGoogle } from "@/features/auth/api/sign-in-with-google";
import { AUTH_ERROR_QUERY_VALUE } from "@/shared/config/auth-routes.config";
import { LoginView } from "@/views/login/ui/LoginView";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <LoginView hasAuthError={error === AUTH_ERROR_QUERY_VALUE} onSignIn={signInWithGoogle} />;
}
