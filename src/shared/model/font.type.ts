/**
 * 서체 넷의 이름이다. `globals.css`의 --font-sans·--font-medium·--font-semibold·--font-bold
 * 값과 글자까지 같아야 한다 — 어긋나면 유틸이 없는 서체를 물고 기본 서체로 떨어진다.
 *
 * 자산 표와 소스 맵이 이 이름을 키로 읽는다. 타입이 바탕이고 상수가 그것을 따른다.
 */

export type FontFamilyName =
  | "WantedSans-Regular"
  | "WantedSans-Medium"
  | "WantedSans-SemiBold"
  | "WantedSans-Bold";

export type FontLoadingState = {
  loaded: boolean;
  error: Error | null;
};
