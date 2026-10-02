/**
 * 알림이 적는 시각의 꼴이다 — `"2025-09-13T09:00:00+09:00"`은 `"09:00"`이다. 시각은
 * 24시간제다(`docs/2-design/design-system/writing.md`).
 *
 * **목록 줄과 푸시 아래줄이 같은 손을 쓴다.** 같은 알림의 시각이 화면과 기기에서 다르게
 * 읽히면 안 되고, 꼴을 두 자리에 적으면 한쪽만 고쳐진다.
 *
 * `shared/utils/`가 아니라 이 슬라이스에 선 것은 [`title.utils.ts`](title.utils.ts)가
 * `supabase/functions/_shared/`로 복사돼 Deno로 도는 파일이라서다 — 복사 경로에 `shared/`가
 * 없고, 넣으면 공용 폴더 전체가 Deno의 제약(`node:` import 금지)을 받는다. 같은 꼴을 적는
 * 사본이 `screens/approvals`와 `screens/stats`에도 있고 그 둘은 Edge 밖이라 공용 자리로
 * 모을 수 있다 — plan AC-13이 그 묶음을 든다.
 */

const KST_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

export function spellKstClock(instant: string | Date): string {
  return KST_CLOCK.format(
    instant instanceof Date ? instant : new Date(instant),
  );
}
