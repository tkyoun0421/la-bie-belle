/**
 * 사진 시트의 「구글 사진으로」 줄이 서는 조건이다
 * (`docs/2-design/modules/account/screens/profile.md`의 「사진 고치기」).
 *
 * 그 줄은 되돌리는 길이라 되돌아갈 자리가 있어야 선다. 구글 계정에 사진이 없으면 갈 곳이
 * 없고, 지금 쓰는 것이 이미 그 사진이면 눌러도 아무 일이 안 일어난다 — 눌러서 아무 일도
 * 안 일어나는 줄을 세우지 않는다.
 */
export function shouldOfferGooglePhoto(
  currentPhotoUrl: string | null,
  googlePhotoUrl: string | null,
): boolean {
  return googlePhotoUrl !== null && currentPhotoUrl !== googlePhotoUrl;
}
