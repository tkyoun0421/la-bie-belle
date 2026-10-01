/**
 * 앱이 사는 주소다. 종이의 QR이 담는 링크의 앞부분이고
 * (`src/entities/attendance/model/checkInUrl.ts`), 실제 도메인은 첫 출시 준비가 채운다
 * (`docs/5-deploy/environments.md`의 Q-03).
 *
 * **비면 던진다.** `read-supabase-env.ts`와 같은 틀이다 — `EXPO_PUBLIC_*`은 빌드 시점에
 * 번들에 박히므로 값이 빈 채 배포되면 실행 중에 채울 길이 없고, 그 사실을 첫 호출에서
 * 드러내는 편이 빈 주소로 구운 QR을 벽에 붙이는 것보다 낫다.
 */

export function readAppUrl(): string {
  const value = process.env.EXPO_PUBLIC_APP_URL;

  if (!value) {
    throw new Error(
      "환경 변수 EXPO_PUBLIC_APP_URL 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  }

  return value;
}
