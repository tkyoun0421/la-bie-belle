import { usePathname, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_HOME_PATH,
  LOGIN_PATH,
  NOTIFICATIONS_PATH,
  REHEARSALS_PATH,
  STATS_PATH,
} from "@/shared/consts/navigation.const";
import { THEME_LABEL } from "@/shared/consts/theme.const";
import { useToast, type ToastState } from "@/shared/hooks/useToast";
import { useTheme } from "@/shared/stores/theme.store";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";
import { PROFILE_COPY } from "@/screens/profile/consts/profile.const";
import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant.policy";

export type ProfileSheetName = "contact" | "photo" | "theme" | null;

export type ProfileScreenController = {
  loading: boolean;
  unread: boolean;
  userId: string | null;
  profileId: string | null;
  photoUrl: string | null;
  googlePhotoUrl: string | null;
  admin: boolean;
  rehearsal: boolean;
  phone: string;
  themeLabel: string;
  notificationEnabled: boolean | null;
  sheet: ProfileSheetName;
  toast: ToastState | null;
  signingOut: boolean;
  openContact: () => void;
  openPhoto: () => void;
  openTheme: () => void;
  closeSheet: () => void;
  savedContact: () => void;
  savedPhoto: () => void;
  leave: () => void;
  dismissToast: () => void;
  goNotifications: () => void;
  goStats: () => void;
  goRehearsals: () => void;
  goAdmin: () => void;
  goLogin: () => void;
};

export function useProfileScreen(): ProfileScreenController {
  const router = useRouter();
  const pathname = usePathname();
  const [sheet, setSheet] = useState<ProfileSheetName>(null);

  const { toast, showToast, dismissToast } = useToast();
  const theme = useTheme((at) => at.theme);

  const { user, profile, isAdmin, isLoading } = useMyStanding(supabase);
  const profileId = profile?.id ?? null;
  const contact = useProfilePrivateQuery(supabase, profileId);
  const { data: grants } = useQualificationsQuery(supabase);
  const unreadCount = useUnreadCountQuery(supabase);

  const { signOut, isPending: signingOut } = useSignOutMutation(supabase);

  const closeSheet = useCallback(() => setSheet(null), []);

  const finish = useCallback(
    (message: string) => {
      showToast("info", message);
      setSheet(null);
    },
    [showToast],
  );

  const savedContact = useCallback(
    () => finish(PROFILE_COPY.contactSaved),
    [finish],
  );

  const savedPhoto = useCallback(
    () => finish(PROFILE_COPY.photoSaved),
    [finish],
  );

  const goNotifications = useCallback(() => {
    router.push(`${NOTIFICATIONS_PATH}?from=${pathname}`);
  }, [router, pathname]);

  const goStats = useCallback(() => {
    router.push(STATS_PATH);
  }, [router]);

  const goRehearsals = useCallback(() => {
    router.push(REHEARSALS_PATH);
  }, [router]);

  const goAdmin = useCallback(() => {
    router.push(ADMIN_HOME_PATH);
  }, [router]);

  const goLogin = useCallback(() => {
    router.replace(LOGIN_PATH);
  }, [router]);

  const leave = useCallback(() => {
    signOut(goLogin);
  }, [signOut, goLogin]);

  return {
    loading: isLoading || (profileId !== null && contact.isLoading),
    unread: (unreadCount.data ?? 0) > 0,
    userId: user?.id ?? null,
    profileId,
    photoUrl: profile?.photoUrl ?? null,
    googlePhotoUrl: user?.googlePhotoUrl ?? null,
    admin: isAdmin,
    rehearsal: isAdmin || hasRehearsalGrant(grants ?? [], profileId),
    phone: contact.data?.phone ?? "",
    themeLabel: THEME_LABEL[theme],
    notificationEnabled: profile ? profile.notificationsEnabled : null,
    sheet,
    toast,
    signingOut,
    openContact: () => setSheet("contact"),
    openPhoto: () => setSheet("photo"),
    openTheme: () => setSheet("theme"),
    closeSheet,
    savedContact,
    savedPhoto,
    leave,
    dismissToast,
    goNotifications,
    goStats,
    goRehearsals,
    goAdmin,
    goLogin,
  };
}
