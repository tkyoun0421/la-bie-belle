/**
 * 알림 목록 화면의 정해진 값이다. 정본은
 * `docs/2-design/system/navigation.md`의 「뒤로」다.
 *
 * **앱바 뒤로를 가진 화면에만 출처를 싣는다.** 탭 화면은 앱바 뒤로가 없어 실어도 받을 자리가
 * 없고, 거기서는 기기 뒤로가 알림 목록으로 돌려보낸다.
 */

export const BACK_BEARING_PREFIXES = ["/admin/schedule", "/admin/approvals"];
