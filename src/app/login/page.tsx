import { LoginScreen } from "@/screens/login/ui/login-screen";
import { enterRoute } from "@/app/auth-gate";
import { signInWithGoogle } from "@/app/login/actions";

export default async function LoginPage() {
  await enterRoute("/login");

  return <LoginScreen onSignIn={signInWithGoogle} />;
}
