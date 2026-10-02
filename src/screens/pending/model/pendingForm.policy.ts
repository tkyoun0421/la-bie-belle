import {
  STEPS,
  type PendingStage,
  type Step,
} from "@/screens/pending/model/pendingForm.type";

/**
 * 가입 프로필 화면의 판정 둘이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`다.
 *
 * **열린 칸을 따로 안 든다.** 「굳은 것이 무엇인가」에서 계산되므로 둘이 어긋날 자리가
 * 없다 — 굳은 것을 녹이면 그 칸이 저절로 다시 열린다.
 *
 * **거절이 보낸 것보다 앞선다.** 거절당한 사람도 `submitted_at`을 들고 있어, 순서를
 * 뒤집으면 거절 장면이 영영 안 선다.
 */

export function firstOpenStep(frozen: readonly Step[]): Step | null {
  return STEPS.find((step) => !frozen.includes(step)) ?? null;
}

export type StageSource = {
  submitted_at: string | null;
  rejected_at: string | null;
};

export function stageOfProfile(profile: StageSource | null): PendingStage {
  if (profile?.rejected_at) {
    return "rejected";
  }

  return profile?.submitted_at ? "waiting" : "form";
}
