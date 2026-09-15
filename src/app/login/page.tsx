import { LoginScreen } from "@/screens/login/ui/login-screen";
import { signInWithGoogle } from "@/app/login/actions";

export default function LoginPage() {
  return <LoginScreen onSignIn={signInWithGoogle} />;
}
