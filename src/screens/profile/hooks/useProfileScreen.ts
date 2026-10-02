import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
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

/**
 * 근무자가 자기 것을 보고 고칠 수 있는 둘만 고치는 화면의 controller다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`고 완료 조건은
 * `docs/2-design/spec/profile-screen.md`다.
 *
 * **시트는 한 번에 하나다.** 연락처·사진·화면 셋이 같은 겹을 쓰는데, 앞의 둘은 성공하면
 * 저절로 닫힌다 — 열림이 통신 결과에 매여 있어 화면 것이 아니다.
 *
 * **알림 자리는 권한이 정한다.** 거부된 기기에는 스위치 대신 안내 두 줄이 서고, 그 갈림은
 * `getProfileNotificationRow`가 낸다. 이 기기에 주소가 섰는지는 「나」가 읽는 값이 아니라
 * 권한이 허락일 때만 서는 것이라 갈래를 물을 때 권한을 그 자리에 넣는다 — 켜진 스위치와
 * 안 닿는 기기를 근무자에게 갈라 말하지 않아서 둘이 같은 모습이다(profile.md 「알림」).
 *
 * **끄기 전에 한 번 묻는다.** 켜기는 바로 켜지고 끄기만 Dialog를 거친다 — 되돌리는 길은
 * 같은 스위치라 조르지 않는다.
 *
 * **고르는 것과 올리는 것이 갈린다.** 기기 앨범까지가 `pickPhoto.lib.ts`고 버킷과 프로필은
 * `useUpdatePhotoMutation`이다 — 고르다 만 것은 실패가 아니라 그 자리에 「못 올렸어요」가
 * 안 선다.
 *
 * **보낼 데는 안 든다.** 알림 목록·통계·리허설·관리자 모드로 가는 문과 로그아웃 뒤의 자리는
 * `.tsx`가 쥔다.
 */

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
  signOut: (onDone: () => void) => void;
  dismissToast: () => void;
};

export function useProfileScreen(client: DB): ProfileScreenController {
  const [sheet, setSheet] = useState<ProfileSheetName>(null);
  const [contactDraft, setContactDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [turningOff, setTurningOff] = useState(false);

  useSavePushTokenMutation(client, pushToken, APP_STATE);

  const theme = useTheme((at) => at.theme);
  const setTheme = useTheme((at) => at.choose);

  const { data: me } = useSessionUserQuery(client);
  const { data, isLoading } = useMyProfileQuery(client, me?.id ?? null);
  const { data: grants } = useQualificationsQuery(client);
  const unreadCount = useUnreadCountQuery(client);

  const {
    mutate: sendContact,
    isPending: contactSaving,
    isSuccess: contactSaved,
    error: contactError,
    reset: resetContact,
  } = useUpdateContactMutation(client);

  const {
    mutate: sendPhoto,
    isPending: savingPhoto,
    isSuccess: photoSaved,
    isError: photoFailed,
    reset: resetPhoto,
  } = useUpdatePhotoMutation(client);

  const { signOut, isPending: signingOut } = useSignOutMutation(client);

  /**
   * 켤 때만 기기에 묻는다. 허락이 떨어지면 그 자리에서 받은 주소를 들어 두고, 저장은
   * `useSavePushTokenMutation`이 앱이 앞으로 올 때 한다.
   */
  const askPushPermission = useCallback(async () => {
    const asked = await requestPushPermission(PUSH_DEPS);

    setPermission(asked.permission);

    if (asked.permission === "granted" && asked.token !== null) {
      setPushToken(asked.token);
    }

    return asked.permission === "granted";
  }, []);

  const notification = useNotificationSwitchMutation(
    client,
    data?.notifications_enabled ?? false,
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

  return {
    loading: isLoading,
    unread: (unreadCount.data ?? 0) > 0,
    name: data?.display_name ?? "",
    photoUrl: data?.photo_url ?? null,
    roleLabel: admin ? PROFILE_COPY.admin : PROFILE_COPY.worker,
    admin,
    /** 관리자에게도 선다 — 전원의 리허설을 그 화면에서 본다(profile.md 「리허설」). */
    rehearsal: admin || hasRehearsalGrant(grants ?? [], data?.id ?? null),
    gender: spellGender(data?.gender ?? null),
    birthDate: data?.birth_date
      ? spellBirthDate(digitsOfBirthDate(data.birth_date))
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
    /** 쓰는 중에는 틀렸다고 말하지 않는다 — 열한 자리를 다 채운 뒤에 센다. */
    contactInvalid:
      contactDraft.length === PHONE_LENGTH && !isValidPhone(contactDraft),
    canSaveContact: canSaveContact(currentDigits, contactDraft),
    offerGoogle: shouldOfferGooglePhoto(
      data?.photo_url ?? null,
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
    signOut,
    dismissToast: () => setToast(null),
  };
}
