import type { ProfileFormValues } from "@/entities/profile/model/profile.schema";

/**
 * 가입 프로필 화면이 드는 꼴들이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`다.
 *
 * **칸은 하나고 자리가 고정이다.** 다섯을 한 장에 세우지 않는다 — 지금 답할 것 하나만 화면
 * 아래에서 묻고, 규칙에 맞으면 그 칸이 위 더미로 올라가 굳는다. 그래서 상태는 「값 다섯」과
 * 「굳은 것이 무엇인가」 둘이고, 열려 있는 칸은 그 둘에서 계산된다.
 *
 * **장면이 넷이다.** 한 경로가 프로필 작성·보낸 뒤의 축하·승인 대기·거절된 뒤를 다 든다.
 */

export const STEPS = ["photo", "name", "gender", "birthDate", "phone"] as const;

export type Step = (typeof STEPS)[number];

export type PendingStage =
  "loading" | "signedOut" | "form" | "celebrating" | "waiting" | "rejected";

/**
 * 칸에 적히는 값 넷이다. 사진이 안 드는 것은 그것만 길이 다르기 때문이다 — 고르는 즉시
 * 서버에 쓰여서 보내기를 기다리지 않는다(design.md 「프로필 제출·연락처·사진」).
 */
export type PendingFormValues = ProfileFormValues;

export const EMPTY_PENDING_FORM: PendingFormValues = {
  name: "",
  gender: null,
  birthDate: "",
  phone: "",
};
