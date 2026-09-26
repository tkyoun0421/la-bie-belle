import { AccessibilityInfo } from "react-native";

/**
 * 기기의 「동작 줄이기」를 읽는 한 자리다. 근거는
 * `docs/2-design/design-system/foundation/motion.md`의 「접근성」이다 — 위치 이동만 없애고
 * 투명도 크로스페이드는 남긴다. 그래서 조각은 「모션을 끌까」가 아니라 「얼마나 옮길까」를
 * 묻고, 답이 0이면 페이드만 남는다.
 *
 * 판정을 인자로 받는 것은 `react-native` 네임스페이스가 Jest에서 대역이 안 서기 때문이다
 * (`docs/4-test/execution.md` 「돌릴 때」). 기본값에 실물을 두어 부르는 쪽은 그대로다.
 */
export async function motionDistance(
  distance: number,
  isReduceMotionEnabled: () => Promise<boolean> = () =>
    AccessibilityInfo.isReduceMotionEnabled(),
): Promise<number> {
  return (await isReduceMotionEnabled()) ? 0 : distance;
}
