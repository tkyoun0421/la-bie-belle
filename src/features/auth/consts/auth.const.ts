/**
 * 앱의 딥링크 스킴이다. `app.json`의 `scheme`과 같은 글자여야 구글이 돌려보낸 주소가 앱을
 * 연다 — 한쪽만 고치면 로그인이 브라우저에서 멈춘다.
 *
 * 환경이 주는 값이 아니라 우리가 정한 이름이라 `config`가 아니고 `consts`다. 개발이든
 * 운영이든 같은 글자다.
 */
export const APP_SCHEME = "labiebelle";
