import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
import { APP_STATE } from "@/shared/lib/appState.lib";
import {
  isProfileGender,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileGender,
} from "@/entities/profile/model/profile.schema";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";
import {
  digitsOfBirthDate,
  isoDateOfDigits,
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
import { useSubmitProfileMutation } from "@/features/profileEdit/services/useSubmitProfileMutation";
import { useUpdatePhotoMutation } from "@/features/profileEdit/services/useUpdatePhotoMutation";
import { PUSH_DEPS } from "@/features/pushSwitch/lib/pushDeps.lib";
import { requestPushPermission } from "@/features/pushSwitch/lib/pushPermission.lib";
import { useSavePushTokenMutation } from "@/features/pushSwitch/services/useSavePushTokenMutation";
import {
  BIRTH_DATE_LENGTH,
  CELEBRATION_STAY_MS,
  INITIAL_NOTIFICATION_PROMPT_VIEW,
  PENDING_FORM_COPY,
  PENDING_PHONE_LENGTH,
  PROMPT_OUTCOME_OF,
  ROTATE_INTERVAL_MS,
  ROTATING_LINES,
} from "@/screens/pending/consts/pending.const";
import {
  transitionNotificationPromptView,
  type NotificationPromptCopy,
  type NotificationPromptView,
} from "@/screens/pending/model/notificationPrompt.policy";
import {
  firstOpenStep,
  stageOfProfile,
} from "@/screens/pending/model/pendingForm.policy";
import {
  EMPTY_PENDING_FORM,
  STEPS,
  type PendingFormValues,
  type PendingStage,
  type Step,
} from "@/screens/pending/model/pendingForm.type";
import { getNotificationPromptCopy } from "@/screens/pending/utils/notificationPromptCopy.utils";

/**
 * 로그인한 사람이 프로필을 적어 가입을 끝내는 자리의 controller다. 한 경로가 장면 넷을
 * 든다 — 프로필 작성, 보낸 뒤의 축하, 승인 대기, 거절된 뒤. 정본은
 * `docs/2-design/modules/account/screens/login.md`고 완료 조건은
 * `docs/2-design/spec/profile-form.md`다.
 *
 * **칸은 하나고 자리가 고정이다.** 다섯을 한 장에 세우지 않는다. 지금 답할 것 하나만 묻고,
 * 규칙에 맞으면 그 칸이 위 더미로 올라가 굳는다. 굳은 것을 누르면 다시 물음으로 내려온다.
 * 그래서 상태는 「값 넷」과 「굳은 것이 무엇인가」 둘이고, 열려 있는 칸은 그 둘에서
 * 계산된다 — 따로 들고 있지 않는다.
 *
 * **사진만 길이 다르다.** 고르는 즉시 서버에 쓰여서 보내기를 안 기다린다 — 그래서 값 넷에
 * 안 들고, 지금 사진은 프로필 행이 들고 있는 것이다.
 *
 * **장면은 프로필 행이 정하고 사람이 덮는다.** 시각 둘이 기본 장면을 내고
 * (`stageOfProfile`), 「다시 보내기」와 보낸 직후의 축하만 그 위를 덮는다 — 보내고 나면
 * 행이 낡아 다시 읽히는데, 그 결과가 축하를 덮어 버리면 안 된다.
 *
 * **축하는 계정마다 한 번이다.** 거절 뒤 다시 보낸 것이면 축하 없이 바로 승인 대기다.
 * 한 번이라도 보낸 적이 있는지는 개인정보 행이 있는지로 안다 — 차단이 풀린 사람은
 * `submitted_at`이 비워진 채 지난 값만 남아서 그 자리에 다시 선다.
 *
 * **알림은 저절로 안 묻는다.** 사람이 「알림 켜기」를 눌러야 기기가 묻는다 — 켜도 화면이
 * 안 넘어가고 안 켜도 안 막힌다
 * ([NTF-018](../../../../docs/2-design/modules/notification/README.md#ntf-018)).
 *
 * **보낼 데는 안 든다.** 세션이 없을 때 어디로 보내는지와 로그아웃 뒤의 자리는 `.tsx`가 쥔다.
 */

export type PendingScreenController = {
  stage: PendingStage;
  email: string;
  photoUrl: string | null;
  name: string;
  open: Step | null;
  shown: Record<Step, boolean>;
  values: PendingFormValues;
  nameLine: string;
  genderLine: string;
  birthDateLine: string;
  phoneLine: string;
  birthDateGuide: string | undefined;
  phoneGuide: string | undefined;
  uploading: boolean;
  photoFailed: boolean;
  submitting: boolean;
  submitFailed: boolean;
  canSubmit: boolean;
  rotatingLine: string;
  prompt: NotificationPromptCopy;
  promptTone: NotificationPromptView;
  signingOut: boolean;
  writeName: (typed: string) => void;
  submitName: () => void;
  chooseGender: (picked: string) => void;
  writeBirthDate: (typed: string) => void;
  writePhone: (typed: string) => void;
  touch: (step: Step) => void;
  thaw: (step: Step) => void;
  freezePhoto: () => void;
  pickPhoto: () => Promise<void>;
  send: () => void;
  retry: () => void;
  turnOnNotifications: () => Promise<void>;
  signOut: (onDone: () => void) => void;
};

export function usePendingScreen(client: DB): PendingScreenController {
  const [seeded, setSeeded] = useState(false);
  const [override, setOverride] = useState<PendingStage | null>(null);
  const [values, setValues] = useState<PendingFormValues>(EMPTY_PENDING_FORM);
  const [frozen, setFrozen] = useState<Step[]>([]);
  const [touched, setTouched] = useState<Step[]>([]);
  const [everSubmitted, setEverSubmitted] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);
  const [picking, setPicking] = useState(false);
  const [line, setLine] = useState(0);
  const [promptView, setPromptView] = useState<NotificationPromptView>(
    INITIAL_NOTIFICATION_PROMPT_VIEW,
  );
  const [pushToken, setPushToken] = useState<string | null>(null);

  useSavePushTokenMutation(client, pushToken, APP_STATE);

  const { data: me } = useSessionUserQuery(client);
  const { data: profile } = useMyProfileRowQuery(client, me?.id ?? null);
  const privateQuery = useProfilePrivateQuery(client, profile?.id ?? null);

  const {
    mutate: sendProfile,
    isPending: submitting,
    isSuccess: submitted,
    isError: submitFailed,
    reset: resetSubmit,
  } = useSubmitProfileMutation(client);

  const {
    mutate: sendPhoto,
    isPending: savingPhoto,
    isSuccess: photoSaved,
    isError: photoSaveFailed,
    reset: resetPhoto,
  } = useUpdatePhotoMutation(client);

  const { signOut, isPending: signingOut } = useSignOutMutation(client);

  const freeze = useCallback((step: Step) => {
    setFrozen((at) => (at.includes(step) ? at : [...at, step]));
  }, []);

  const loading =
    me === undefined ||
    (me !== null &&
      (profile === undefined ||
        (profile !== null && privateQuery.data === undefined)));

  /**
   * 한 번만 씨를 뿌린다. 보낸 뒤 프로필 행이 낡아 다시 읽히는데, 그때 다시 뿌리면 적던
   * 것과 굳은 것이 서버 값으로 되돌아간다.
   */
  useEffect(() => {
    if (seeded || loading || !me) {
      return;
    }

    const contact = privateQuery.data ?? null;
    const gender = isProfileGender(contact?.gender) ? contact.gender : null;
    const answered =
      contact !== null || (profile?.submitted_at ?? null) !== null;

    setValues({
      name: profile?.display_name ?? "",
      gender,
      birthDate: digitsOfBirthDate(contact?.birth_date ?? null),
      phone: digitsOnly(contact?.phone ?? "", PENDING_PHONE_LENGTH),
    });
    setFrozen(answered ? [...STEPS] : []);
    setEverSubmitted(answered);
    setSeeded(true);
  }, [seeded, loading, me, profile, privateQuery.data]);

  useEffect(() => {
    if (submitted) {
      setOverride(everSubmitted ? "waiting" : "celebrating");
      setEverSubmitted(true);
      resetSubmit();
    }
  }, [submitted, everSubmitted, resetSubmit]);

  useEffect(() => {
    if (photoSaved) {
      freeze("photo");
      resetPhoto();
    }
  }, [photoSaved, freeze, resetPhoto]);

  const stage: PendingStage = loading
    ? "loading"
    : me === null
      ? "signedOut"
      : (override ?? stageOfProfile(profile ?? null));

  useEffect(() => {
    if (stage !== "waiting") {
      return;
    }

    const timer = setInterval(
      () => setLine((at) => (at + 1) % ROTATING_LINES.length),
      ROTATE_INTERVAL_MS,
    );

    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "celebrating") {
      return;
    }

    const timer = setTimeout(() => setOverride("waiting"), CELEBRATION_STAY_MS);

    return () => clearTimeout(timer);
  }, [stage]);

  const open = firstOpenStep(frozen);
  const errors: ProfileFormErrors = validateProfileForm(values);

  /** 칸에서 손을 떼기 전에는 틀렸다고 말하지 않는다 — 적는 중에 빨개지지 않게. */
  const guideOf = (step: "birthDate" | "phone"): string | undefined =>
    touched.includes(step) ? errors[step] : undefined;

  /** 적는 즉시 굳는 칸 둘이다 — 꼴이 맞는 순간 다음 칸으로 넘어간다. */
  const writeChecked = (step: "birthDate" | "phone", next: string) => {
    const edited = { ...values, [step]: next };

    setValues(edited);

    if (validateProfileForm(edited)[step] === undefined) {
      freeze(step);
    }
  };

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

  const turnOnNotifications = useCallback(async () => {
    const asked = await requestPushPermission(PUSH_DEPS);

    if (asked.permission === "granted" && asked.token !== null) {
      setPushToken(asked.token);
    }

    setPromptView((at) =>
      transitionNotificationPromptView(at, PROMPT_OUTCOME_OF[asked.permission]),
    );
  }, []);

  return {
    stage,
    email: me?.email ?? "",
    photoUrl: profile?.photo_url ?? me?.googlePhotoUrl ?? null,
    name: values.name,
    open,
    shown: {
      photo: frozen.includes("photo"),
      name: frozen.includes("name"),
      gender: frozen.includes("gender") && values.gender !== null,
      birthDate: frozen.includes("birthDate"),
      phone: frozen.includes("phone"),
    },
    values,
    nameLine: `${values.name}${PENDING_FORM_COPY.greetingSuffix}`,
    genderLine: spellGender(values.gender),
    birthDateLine: spellBirthDate(values.birthDate),
    phoneLine: hyphenatePhone(values.phone),
    birthDateGuide: guideOf("birthDate"),
    phoneGuide: guideOf("phone"),
    uploading: picking || savingPhoto,
    photoFailed: pickFailed || photoSaveFailed,
    submitting,
    submitFailed,
    canSubmit: open === null,
    rotatingLine: ROTATING_LINES[line],
    prompt: getNotificationPromptCopy(promptView),
    promptTone: promptView,
    signingOut,
    writeName: (typed: string) => setValues((at) => ({ ...at, name: typed })),
    submitName: () => {
      if (values.name.trim() !== "") {
        freeze("name");
      }
    },
    chooseGender: (picked: string) => {
      if (isProfileGender(picked)) {
        setValues((at) => ({ ...at, gender: picked as ProfileGender }));
        freeze("gender");
      }
    },
    writeBirthDate: (typed: string) =>
      writeChecked("birthDate", digitsOnly(typed, BIRTH_DATE_LENGTH)),
    writePhone: (typed: string) =>
      writeChecked("phone", digitsOnly(typed, PENDING_PHONE_LENGTH)),
    touch: (step: Step) =>
      setTouched((at) => (at.includes(step) ? at : [...at, step])),
    thaw: (step: Step) =>
      setFrozen((at) => at.filter((frozenStep) => frozenStep !== step)),
    freezePhoto: () => freeze("photo"),
    pickPhoto,
    send: () =>
      sendProfile({
        displayName: values.name.trim(),
        phone: hyphenatePhone(values.phone),
        birthDate: isoDateOfDigits(values.birthDate),
        gender: values.gender ?? "",
      }),
    retry: () => setOverride("form"),
    turnOnNotifications,
    signOut,
  };
}
