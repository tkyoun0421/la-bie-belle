import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_HOME_PATH,
  LOGIN_PATH,
  NOTIFICATIONS_PATH,
  REHEARSALS_PATH,
  STATS_PATH,
} from "@/shared/consts/navigation.const";
import { APP_STATE } from "@/shared/lib/appState.lib";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import type { Theme } from "@/shared/model/theme.type";
import { useTheme } from "@/shared/stores/theme.store";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import {
  getProfileNotificationRow,
  type ProfileNotificationRow,
} from "@/entities/notification/model/profileNotificationRow.policy";
import {
  getReachState,
  type PushPermission,
} from "@/entities/notification/model/reachState.policy";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { isValidPhone } from "@/entities/profile/model/profile.schema";
import { useMyProfileQuery } from "@/entities/profile/services/useMyProfileQuery";
import {
  digitsOfBirthDate,
  spellBirthDate,
} from "@/entities/profile/utils/birthDateDigits.utils";
import {
  digitsOnly,
  hyphenatePhone,
} from "@/entities/profile/utils/phoneDigits.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";
import { PHOTO_PICK_DEPS } from "@/features/profileEdit/lib/photoPickDeps.lib";
import { pickAndShrinkPhoto } from "@/features/profileEdit/lib/pickPhoto.lib";
import { useUpdateContactMutation } from "@/features/profileEdit/services/useUpdateContactMutation";
import { useUpdatePhotoMutation } from "@/features/profileEdit/services/useUpdatePhotoMutation";
import { PUSH_DEPS } from "@/features/pushSwitch/lib/pushDeps.lib";
import {
  getPushPermission,
  requestPushPermission,
} from "@/features/pushSwitch/lib/pushPermission.lib";
import { useNotificationSwitchMutation } from "@/features/pushSwitch/services/useNotificationSwitchMutation";
import { useSavePushTokenMutation } from "@/features/pushSwitch/services/useSavePushTokenMutation";
import {
  PHONE_LENGTH,
  PROFILE_COPY,
  THEME_LABEL,
} from "@/screens/profile/consts/profile.const";
import { canSaveContact } from "@/screens/profile/model/canSaveContact.policy";
import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant.policy";
import { shouldOfferGooglePhoto } from "@/screens/profile/model/shouldOfferGooglePhoto.policy";

export type ProfileSheetName = "contact" | "photo" | "theme" | null;

export type ProfileScreenController = {
  loading: boolean;
  unread: boolean;
  name: string;
  photoUrl: string | null;
  roleLabel: string;
  admin: boolean;
  rehearsal: boolean;
  gender: string;
  birthDate: string;
  phone: string;
  theme: Theme;
  themeLabel: string;
  notificationRow: ProfileNotificationRow;
  notificationEnabled: boolean;
  turningOff: boolean;
  sheet: ProfileSheetName;
  contactDraft: string;
  contactSaving: boolean;
  contactFailed: boolean;
  contactRejected: boolean;
  contactInvalid: boolean;
  canSaveContact: boolean;
  offerGoogle: boolean;
  uploading: boolean;
  photoFailed: boolean;
  toast: string | null;
  signingOut: boolean;
  openContact: () => void;
  openPhoto: () => void;
  openTheme: () => void;
  closeSheet: () => void;
  writeContact: (typed: string) => void;
  saveContact: () => void;
  pickPhoto: () => Promise<void>;
  useGooglePhoto: () => void;
  chooseTheme: (chosen: Theme) => void;
  turnOnNotifications: () => void;
  askTurnOff: () => void;
  cancelTurnOff: () => void;
  confirmTurnOff: () => void;
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
  const [contactDraft, setContactDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [turningOff, setTurningOff] = useState(false);

  useSavePushTokenMutation(supabase, pushToken, APP_STATE);

  const theme = useTheme((at) => at.theme);
  const setTheme = useTheme((at) => at.choose);

  const { data: me } = useSessionUserQuery(supabase);
  const { data, isLoading } = useMyProfileQuery(supabase, me?.id ?? null);
  const { data: grants } = useQualificationsQuery(supabase);
  const unreadCount = useUnreadCountQuery(supabase);

  const {
    mutate: sendContact,
    isPending: contactSaving,
    isSuccess: contactSaved,
    error: contactError,
    reset: resetContact,
  } = useUpdateContactMutation(supabase);

  const {
    mutate: sendPhoto,
    isPending: savingPhoto,
    isSuccess: photoSaved,
    isError: photoFailed,
    reset: resetPhoto,
  } = useUpdatePhotoMutation(supabase);

  const { signOut, isPending: signingOut } = useSignOutMutation(supabase);

  const askPushPermission = useCallback(async () => {
    const asked = await requestPushPermission(PUSH_DEPS);

    setPermission(asked.permission);

    if (asked.permission === "granted" && asked.token !== null) {
      setPushToken(asked.token);
    }

    return asked.permission === "granted";
  }, []);

  const notification = useNotificationSwitchMutation(
    supabase,
    data?.notificationsEnabled ?? false,
    askPushPermission,
  );

  useEffect(() => {
    void getPushPermission(PUSH_DEPS.getPermissionsAsync)
      .then(setPermission)
      .catch(() => {});
  }, []);

  const closeSheet = useCallback(() => {
    setSheet(null);
    setPickFailed(false);
    resetContact();
    resetPhoto();
  }, [resetContact, resetPhoto]);

  const finish = useCallback(
    (message: string) => {
      setToast(message);
      closeSheet();
    },
    [closeSheet],
  );

  useEffect(() => {
    if (contactSaved) {
      finish(PROFILE_COPY.contactSaved);
    }
  }, [contactSaved, finish]);

  useEffect(() => {
    if (photoSaved) {
      finish(PROFILE_COPY.photoSaved);
    }
  }, [photoSaved, finish]);

  const phone = data?.phone ?? "";
  const currentDigits = digitsOnly(phone, PHONE_LENGTH);
  const contactCode = errorCodeOf(contactError);

  const openContact = useCallback(() => {
    setContactDraft(currentDigits);
    setSheet("contact");
  }, [currentDigits]);

  const pickPhoto = useCallback(async () => {
    setPicking(true);
    setPickFailed(false);

    try {
      const picked = await pickAndShrinkPhoto(PHOTO_PICK_DEPS);

      if (picked !== null && me) {
        sendPhoto({ userId: me.id, ...picked });
      }
    } catch {
      setPickFailed(true);
    } finally {
      setPicking(false);
    }
  }, [me, sendPhoto]);

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
    name: data?.displayName ?? "",
    photoUrl: data?.photoUrl ?? null,
    roleLabel: admin ? PROFILE_COPY.admin : PROFILE_COPY.worker,
    admin,
    rehearsal: admin || hasRehearsalGrant(grants ?? [], data?.id ?? null),
    gender: spellGender(data?.gender ?? null),
    birthDate: data?.birthDate
      ? spellBirthDate(digitsOfBirthDate(data.birthDate))
      : "",
    phone,
    theme,
    themeLabel: THEME_LABEL[theme],
    notificationRow: getProfileNotificationRow(
      getReachState({
        notificationsEnabled: data ? notification.enabled : null,
        hasDevice: permission === null ? null : permission === "granted",
        permission,
      }),
      notification.isPending,
    ),
    notificationEnabled: notification.enabled,
    turningOff,
    sheet,
    contactDraft,
    contactSaving,
    contactFailed: contactError !== null && contactCode !== "invalid_phone",
    contactRejected: contactCode === "invalid_phone",
    contactInvalid:
      (contactDraft.length === PHONE_LENGTH && !isValidPhone(contactDraft)) ||
      contactCode === "invalid_phone",
    canSaveContact: canSaveContact(currentDigits, contactDraft),
    offerGoogle: shouldOfferGooglePhoto(
      data?.photoUrl ?? null,
      me?.googlePhotoUrl ?? null,
    ),
    uploading: picking || savingPhoto,
    photoFailed: pickFailed || photoFailed,
    toast,
    signingOut,
    openContact,
    openPhoto: () => setSheet("photo"),
    openTheme: () => setSheet("theme"),
    closeSheet,
    writeContact: (typed: string) =>
      setContactDraft(digitsOnly(typed, PHONE_LENGTH)),
    saveContact: () => {
      if (data) {
        sendContact({
          profileId: data.id,
          phone: hyphenatePhone(contactDraft),
        });
      }
    },
    pickPhoto,
    useGooglePhoto: () => {
      if (me?.googlePhotoUrl) {
        sendPhoto({ photoUrl: me.googlePhotoUrl });
      }
    },
    chooseTheme: (chosen: Theme) => {
      setTheme(chosen);
      setSheet(null);
    },
    turnOnNotifications: notification.turnOn,
    askTurnOff: () => setTurningOff(true),
    cancelTurnOff: () => setTurningOff(false),
    confirmTurnOff: () => {
      setTurningOff(false);
      notification.turnOff();
    },
    leave,
    dismissToast: () => setToast(null),
    goNotifications,
    goStats,
    goRehearsals,
    goAdmin,
    goLogin,
  };
}
