import type {
  NotificationKind,
  NotificationPayload,
} from "@/entities/notification/model/notification.type";

/**
 * 알림이 통신에서 오는 꼴이다. 열 이름이 표 그대로고, 읽는 손 둘(`getNotifications`·
 * `getPushReachable`)의 `returns<>`가 이 꼴을 건다.
 *
 * **`kind`를 글자가 아니라 유니온으로 받는다.** DB의 열은 그냥 `text`라 낳는 쪽과 읽는 쪽이
 * 어긋나도 통과하는데(`docs/2-design/modules/notification/design.md`의 「알림 행」) 그것을 막는
 * 자리가 `model`의 유니온이다 — 꼴을 `string`으로 눕히면 그 그물이 여기서 끊긴다.
 */

export type NotificationRow = {
  id: string;
  profile_id: string;
  kind: NotificationKind;
  payload: NotificationPayload;
  subject_id: string | null;
  created_at: string;
  read_at: string | null;
  claimed_at: string | null;
  push_attempts: number;
  pushed_at: string | null;
};

/**
 * 사람마다 알림이 닿는지만 내는 뷰의 꼴이다. 주소가 안 온다 — `push_tokens`는 본인 행만
 * 읽는 표라 관리자가 남의 주소를 볼 길이 없어 존재 여부만 내는 뷰가 따로 선다.
 */
export type PushReachableRow = {
  profile_id: string;
  has_device: boolean;
};
