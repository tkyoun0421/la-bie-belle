/**
 * 알림 목록 화면의 정해진 값이다. 정본은
 * `docs/2-design/system/navigation.md`의 「뒤로」다.
 *
 * **앱바 뒤로를 가진 화면에만 출처를 싣는다.** 탭 화면은 앱바 뒤로가 없어 실어도 받을 자리가
 * 없고, 거기서는 기기 뒤로가 알림 목록으로 돌려보낸다.
 */

export const BACK_BEARING_PREFIXES = ["/admin/schedule", "/admin/approvals"];

/** 바닥에서 이만큼 남았을 때 다음 쪽을 부른다. 끝에 닿고 나서 부르면 한 박자 빈다. */
export const NEXT_PAGE_SLACK = 240;

/**
 * 화면에 뜨는 글자다. 정본은
 * `docs/2-design/modules/notification/screens/notifications.md`의 문안 표다.
 */
export const NOTIFICATIONS_COPY = {
  appBarTitle: "알림",
  readFailed: "알림을 불러오지 못했어요",
  retry: "다시 시도",
  emptyTitle: "아직 받은 알림이 없어요",
  emptyBody: "근무표가 확정되면 여기 쌓여요",
  end: "여기까지예요",
};
