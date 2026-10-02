import { type NOTIFICATION_KINDS } from "@/entities/notification/consts/notification.const";

/**
 * 알림의 종류와 그 짐이다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「kind와 payload」 표고, 그 표를 옮긴
 * 자리가 `consts`의 목록이고 그 목록 위에 서는 유니온이 이 파일이다. 통신에서 오는 행 꼴은
 * [`api/notification.dto.ts`](../api/notification.dto.ts)가 들고 그 꼴의 `kind`가 이 유니온을
 * 건다.
 *
 * **DB가 `kind`를 안 막는다.** 열이 그냥 `text`라(같은 문서의 「알림 행」) 낳는 쪽과 읽는
 * 쪽이 어긋나도 데이터베이스는 통과시킨다. 막는 자리가 여기고, 문장·목적지 함수가
 * `Record<NotificationKind, …>` 표로 갈래를 들어 하나라도 빠지면 컴파일에서 걸린다.
 *
 * `payload`의 값이 `unknown`인 것은 열쇠마다 타입이 다르고(날짜 문자열·수·문자열 배열) 그
 * 짝이 `kind`에 달려 있어서다. 읽는 함수가 자기가 아는 열쇠만 꺼내 좁힌다.
 *
 * `node:` import를 안 쓴다 — 이 폴더는 `supabase/functions/_shared/`로 복사돼 Deno로 돈다.
 */

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationPayload = Record<string, unknown>;
