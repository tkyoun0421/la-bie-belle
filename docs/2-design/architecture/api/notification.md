# 알림

짝은 [domain/notification.md](../../domain/notification.md)와 [`../data-model/notification.md`](../data-model/notification.md)다.

## 함수

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `post_announcement` | 관리자 | 공지. 승인된 전원에게 행이 선다 |
| `mark_notifications_read` | 근무자 | 읽음 찍기 |
| `save_push_subscription`, `remove_push_subscription` | 근무자 | 기기 구독 |

pg_cron(`internal`) — `emit_reminders`(전날 저녁 9시·시작 10분 전·빈자리 재촉), `retry_push`(미발송 알림 다시 쏘기).

사건 알림은 함수가 없다 — 사건을 일으킨 함수가 같은 트랜잭션에서 넣는다.

## 푸시

**경로 둘, 함수 하나.** `notifications`에 행이 들어오면 Database Webhook이 Edge Function `send-push`를 부른다. pg_net은 한 번 쏘고 끝이라 놓친 것은 pg_cron의 `retry_push`가 매분 같은 함수를 다시 부른다.

**잡기와 성공은 다른 열이다.** 함수가 먼저 잡는다 — `update notifications set claimed_at = now(), push_attempts = push_attempts + 1 where id = any($1) and pushed_at is null and push_attempts < 5 and (claimed_at is null or claimed_at < now() - interval '2 minutes') returning *`. 잡힌 행만 보내고 성공한 행에만 `pushed_at`을 찍는다. 보내다 죽으면 2분 뒤 다시 잡힌다. `retry_push`가 보는 조건이 이 문장과 같아 두 경로가 같은 규칙을 탄다. 다섯 번 넘으면 그만둔다 — 앱을 열면 알림 행은 그대로 있다.

**Edge Function은 얼개다.** 알림 행 잡기 → `src/features/notification/model/`의 순수 함수로 payload와 처리 방법 정하기 → `npm:web-push`로 보내기 → 성공이면 `pushed_at`, 410이면 구독 지우기. 판단(어떤 실패가 재시도인가, 어떤 것이 구독 폐기인가)은 전부 `src/`의 순수 함수라 unit 테스트가 지킨다. 그 함수들은 Node 전용 API를 안 쓴다 — lint가 `src/features/notification/model/`에서 `node:` import를 막는다.

**Deno는 `supabase/functions` 밖을 못 읽는다.** edge-runtime 컨테이너에 그 폴더 하나만 마운트돼서, `deno.json`이 `../../src/`를 맵핑해도 파일이 컨테이너 안에 없다. 심볼릭 링크도 타깃이 마운트 밖이라 끊긴다. 그래서 CI가 `src/features/notification/model/`을 `supabase/functions/_shared/`로 복사한 뒤 Supabase를 띄운다 — `.github/workflows/ci.yml`의 `ci` 잡, `supabase start` 줄 앞이다. 복사본은 생성물이라 커밋하지 않는다. 정본은 `src/`다.

얼개 자체는 e2e가 본다. CI가 `supabase functions serve`를 띄우고 가짜 푸시 엔드포인트로 한 번 돌린다.

**service role은 `send-push` 안에만 있다.** 사용자 세션 없이 돌아 `notifications`와 `push_subscriptions`만 만진다 — 서비스 키 자리 둘 중 하나.

**비밀은 저장소 밖이다.** VAPID 키는 Edge Function secret이고 공개키만 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`로 브라우저에 간다. Webhook 트리거의 인증 헤더는 Vault에서 읽는다 — 트리거 정의에 리터럴로 넣으면 마이그레이션에 실려 PUBLIC 저장소에 올라간다.
