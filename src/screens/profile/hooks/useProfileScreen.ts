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
import { useTheme } from "@/shared/stores/theme.store";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { useMyProfileQuery } from "@/entities/profile/services/useMyProfileQuery";
import {
  digitsOfBirthDate,
  spellBirthDate,
} from "@/entities/profile/utils/birthDateDigits.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";
import { PROFILE_COPY } from "@/screens/profile/consts/profile.const";
import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant.policy";

export type ProfileSheetName = "contact" | "photo" | "theme" | null;

export type ProfileScreenController = {
  loading: boolean;
  unread: boolean;
  userId: string | null;
  profileId: string | null;
  name: string;
  photoUrl: string | null;
  googlePhotoUrl: string | null;
  roleLabel: string;
  admin: boolean;
  rehearsal: boolean;
  gender: string;
  birthDate: string;
  phone: string;
  themeLabel: string;
  notificationEnabled: boolean | null;
  sheet: ProfileSheetName;
  toast: string | null;
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
  const [toast, setToast] = useState<string | null>(null);

  const theme = useTheme((at) => at.theme);

  const { data: me } = useSessionUserQuery(supabase);
  const { data, isLoading } = useMyProfileQuery(supabase, me?.id ?? null);
  const { data: grants } = useQualificationsQuery(supabase);
  const unreadCount = useUnreadCountQuery(supabase);

  const { signOut, isPending: signingOut } = useSignOutMutation(supabase);

  const closeSheet = useCallback(() => setSheet(null), []);

  const finish = useCallback((message: string) => {
    setToast(message);
    setSheet(null);
  }, []);

  const savedContact = useCallback(
    () => finish(PROFILE_COPY.contactSaved),
    [finish],
  );

  const savedPhoto = useCallback(
    () => finish(PROFILE_COPY.photoSaved),
    [finish],
  );

  const admin = data?.role === "admin";

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
    loading: isLoading,
    unread: (unreadCount.data ?? 0) > 0,
    userId: me?.id ?? null,
    profileId: data?.id ?? null,
    name: data?.displayName ?? "",
    photoUrl: data?.photoUrl ?? null,
    googlePhotoUrl: me?.googlePhotoUrl ?? null,
    roleLabel: admin ? PROFILE_COPY.admin : PROFILE_COPY.worker,
    admin,
    rehearsal: admin || hasRehearsalGrant(grants ?? [], data?.id ?? null),
    gender: spellGender(data?.gender ?? null),
    birthDate: data?.birthDate
      ? spellBirthDate(digitsOfBirthDate(data.birthDate))
      : "",
    phone: data?.phone ?? "",
    themeLabel: THEME_LABEL[theme],
    notificationEnabled: data ? data.notificationsEnabled : null,
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
    dismissToast: () => setToast(null),
    goNotifications,
    goStats,
    goRehearsals,
    goAdmin,
    goLogin,
  };
}
