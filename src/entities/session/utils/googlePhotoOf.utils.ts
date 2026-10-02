/**
 * 구글이 세션 메타데이터에 실어 보낸 사진 주소를 꺼낸다. 열쇠가 둘인 것은 공급자가 자리마다
 * 다른 이름을 쓰기 때문이고, 그 이름은 **우리가 정한 값이 아니라** 구글이 정한 것이다.
 *
 * `features/auth`가 아니라 여기 사는 까닭은 **세션을 만들거나 끊지 않기** 때문이다 — 이미 든
 * 세션이 들고 온 값을 읽을 뿐이라 `entities/session`의 읽기 쪽이다.
 */

const PHOTO_KEYS = ["avatar_url", "picture"];

export function googlePhotoOf(
  metadata: Record<string, unknown>,
): string | null {
  for (const key of PHOTO_KEYS) {
    const value = metadata[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}
