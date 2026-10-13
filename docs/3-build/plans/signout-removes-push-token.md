# 로그아웃이 기기의 push 토큰을 지운다

로그아웃한 기기에 그 계정의 알림이 계속 간다. `features/auth/lib/signOut.lib.ts`의 순서(`removePushToken` → `auth.signOut` → 캐시 비우기 → 영속본 삭제)는 섰는데 `useSignOutMutation`이 앞과 끝 둘에 빈 함수(`DEVICE_CLEANUP_NOT_WIRED_YET`)를 꽂는다. 공용 기기면 다음 사람이 앞 사람의 근무 알림을 본다.

## 입력 명세·기준

정본은 [account 설계](../../2-design/modules/account/design.md)의 「로그아웃·퇴사·차단 뒤 기기 정리」다 — 로그아웃에서 `remove_push_token`을 먼저 부르고, 캐시와 기기 저장소의 영속본과 시각 오프셋을 지운다. 발견은 [감사](../../proposals/post-refactor-audit.md)의 첫 묶음이다.

## 판정 — 묻지 말고 이 꼴로 쓴다

**토큰 지우기는 `features/auth`로 옮긴다.** `removePushToken.api.ts`가 `features/pushSwitch/api`에 사는데 `src`에서 부르는 곳이 0이다 — 짝 integration 테스트만 있다. 로그아웃 use case가 쓰는 유일한 통신이니 `features/auth/api/`로 옮긴다. 규칙 3이 `features/auth` → `features/pushSwitch`를 막으니 다른 길이 없다.

**토큰은 묻지 않고 읽는다.** 로그아웃은 권한 창을 띄우면 안 된다. `features/auth/lib/devicePushToken.lib.ts`의 `readGrantedPushToken(deps)`가 권한이 `granted`일 때만 `getExpoPushTokenAsync`로 토큰을 받고, 아니면 `null`이다. projectId가 없거나 토큰 받기가 던지면 `null`이다. `null`이면 지울 것이 없으니 rpc를 안 부른다.

**projectId 읽기는 `shared/config`로 내린다.** `features/pushSwitch/config/pushSwitch.config.ts`의 `readPushProjectId`를 `shared/config/push.config.ts`로 옮기고 부르던 넷이 따라간다. 도메인을 모르는 환경 값이다.

**토큰 지우기가 실패해도 로그아웃은 간다.** 오프라인에서 로그아웃이 안 되면 더 나쁘다. `removePushToken` 손이 실패를 삼키고 다음으로 간다 — 서버에 토큰이 남는 것은 다음 로그인의 `save_push_token`이 덮는다. `signOut.lib`의 순서는 그대로다.

**영속본은 시각 오프셋 하나다.** `src`에 query 영속(persister)이 없다. `entities/clock/lib/clockStorage.lib.ts`에 `clearStoredOffset()`을 더한다. 테마는 기기 설정이라 안 지운다.

**`DEVICE_CLEANUP_NOT_WIRED_YET`은 지운다.**

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `features/auth/api/removePushToken.api.ts` + integration 짝 | `features/pushSwitch/api/`에서 옮긴다. 몸은 그대로 |
| `features/auth/lib/devicePushToken.lib.ts` + 짝 | 새로. 권한 `granted`일 때만 토큰, 나머지 `null` |
| `shared/config/push.config.ts` + 짝 | `readPushProjectId`를 옮긴다. 부르는 넷이 따라간다 |
| `entities/clock/lib/clockStorage.lib.ts` + 짝 | `clearStoredOffset()` |
| `features/auth/services/useSignOutMutation.ts` + 짝 | 빈 함수 대신 진짜 손 둘을 꽂는다 |
| `features/auth/lib/signOut.lib.ts` | `DEVICE_CLEANUP_NOT_WIRED_YET`을 지운다 |

## 완료 조건

- **AC-01** 로그아웃이 권한이 `granted`인 기기의 토큰으로 `remove_push_token`을 `auth.signOut`보다 먼저 부른다
- **AC-02** 권한이 없거나 토큰을 못 받으면 rpc를 안 부르고 로그아웃은 간다. 권한 창을 띄우지 않는다
- **AC-03** rpc가 실패해도 `auth.signOut`과 캐시 비우기와 오프셋 삭제가 돈다
- **AC-04** 로그아웃 뒤 시각 오프셋 저장소가 비어 있다
- **AC-05** `DEVICE_CLEANUP_NOT_WIRED_YET`이 `src`에 0건이다
- **AC-06** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 리스크

**새 폴더가 둘 선다** — `features/auth/api/`와 `shared/config/`(있다). `scripts/syncEdgeShared.mts`의 `FOLDERS`에 둘 다 없으니 `edge:sync`와 무관하다.

**새 export마다 규칙 15가 짝을 요구한다** — `readGrantedPushToken`·`clearStoredOffset`·옮긴 `readPushProjectId`. 작성자가 먼저 쓴다.
