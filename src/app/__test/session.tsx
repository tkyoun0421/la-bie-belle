import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { supabase } from "@/shared/api/supabase";
import { armProfileReadFailure, isDevDoorOpen } from "@/shared/utils/devDoor";
import { decideEntry } from "@/features/auth/lib/decideEntry.lib";

const READ_FAILURE = "read_failure";

type DoorParams = {
  access_token?: string;
  refresh_token?: string;
  simulate?: string;
};

export default function Screen() {
  const router = useRouter();
  const { access_token, refresh_token, simulate } =
    useLocalSearchParams<DoorParams>();
  const open = isDevDoorOpen(__DEV__);

  useEffect(() => {
    if (!open || !access_token || !refresh_token) {
      return;
    }

    let abandoned = false;

    void (async () => {
      await supabase.auth.setSession({ access_token, refresh_token });

      if (simulate === READ_FAILURE) {
        armProfileReadFailure();
      }

      const destination = await decideEntry({ client: supabase });

      if (!abandoned) {
        router.replace(destination);
      }
    })();

    return () => {
      abandoned = true;
    };
  }, [open, access_token, refresh_token, simulate, router]);

  if (!open) {
    return <Redirect href="/" />;
  }

  return null;
}
