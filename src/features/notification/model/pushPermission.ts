import type { PushPermission } from "@/features/notification/model/reach-state";

/**
 * 기기에 권한을 읽고 묻는 자리다. 정본은
 * `docs/2-design/spec/notification-settings.md`의 AC-01·AC-06이고 기기 주소의 규칙은
 * `docs/2-design/modules/notification/design.md`의 「기기 주소 저장과 삭제」다.
 *
 * **읽기와 묻기가 다른 함수다.** 화면은 들어오면서 상태를 읽고, 사람이 누를 때만 묻는다
 * ([NTF-017](../../../../docs/2-design/modules/notification/README.md#ntf-017)). 한 함수가
 * 둘을 겸하면 화면이 상태를 알아보려다 권한 창을 띄운다.
 *
 * **안드로이드는 채널이 권한보다 먼저다.** 채널이 없으면 물음 자체가 안 떠서 사람이 거부한
 * 것과 구별이 안 된다(AC-06). iOS는 채널이 없어 그 단계를 건너뛴다 — 정본이 iOS 쪽 차이를
 * 안 적어 plan이 「추가 단계가 없다」를 박았다.
 *
 * **주소를 못 받아도 안 던진다.** `projectId`가 없거나 발급이 실패하면 「켰는데 기기가 없음」
 * 갈래로 돌려준다(상태 격자의 「실패」) — 의사는 이미 참이라 다음 진입에 다시 보낸다.
 *
 * 기기에 붙는 함수는 전부 주입받는다. 여기가 `expo-notifications`를 직접 물면 이 판정이
 * 기기 없이는 안 돈다 — 실물을 묶는 자리는
 * [`push-deps`](push-deps.ts)다.
 */

export type PermissionResponse = { status: string };

export type RequestPushPermissionDeps = {
  platform: string;
  projectId: string | null;
  setNotificationChannelAsync: () => Promise<unknown>;
  requestPermissionsAsync: () => Promise<PermissionResponse>;
  getExpoPushTokenAsync: (options: {
    projectId: string;
  }) => Promise<{ data: string }>;
};

/**
 * 허락일 때만 주소 자리가 선다. 거부와 안 물어본 상태에 `token: null`을 달면 「주소를 못
 * 받았다」와 「물어본 적이 없다」가 같은 모양이 된다.
 */
export type PushPermissionResult =
  | { permission: "denied" | "undetermined" }
  | { permission: "granted"; token: string | null };

const ANDROID = "android";

export function mapPermissionStatus({
  status,
}: PermissionResponse): PushPermission {
  if (status === "granted") {
    return "granted";
  }

  return status === "denied" ? "denied" : "undetermined";
}

export async function getPushPermission(
  getPermissionsAsync: () => Promise<PermissionResponse>,
): Promise<PushPermission> {
  return mapPermissionStatus(await getPermissionsAsync());
}

export async function requestPushPermission({
  platform,
  projectId,
  setNotificationChannelAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
}: RequestPushPermissionDeps): Promise<PushPermissionResult> {
  if (platform === ANDROID) {
    await setNotificationChannelAsync();
  }

  const permission = mapPermissionStatus(await requestPermissionsAsync());

  if (permission !== "granted") {
    return { permission };
  }

  if (projectId === null) {
    return { permission, token: null };
  }

  try {
    const { data } = await getExpoPushTokenAsync({ projectId });

    return { permission, token: data };
  } catch {
    return { permission, token: null };
  }
}
