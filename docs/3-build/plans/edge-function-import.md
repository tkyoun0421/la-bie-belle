# Deno Edge Function이 `src/`를 import할 수 있는지 확인한다

스파이크다. 알림의 Edge Function은 판단을 `src/features/notification/model/`의 순수 함수에 두고 얼개만 Deno에 둔다([notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기)). 그 함수를 `supabase/functions` 밖에서 가져올 수 있는지가 확인 안 됐고, 되는지에 따라 CI 단계가 하나 늘거나 안 는다. 데이터 task의 첫 수라 뒤 task가 이 결과에 기댄다.

## 완료 조건

- 로컬 Supabase에서 `supabase functions serve`로 띄운 함수 하나가 `src/` 아래 `.ts` 하나를 import해 돌아가는지 확인한다. `deno.json`의 `imports` 맵핑으로 시도한다
- 결과가 [notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기)의 그 문단에 들어간다 — 되면 「`deno.json`이 맵핑한다」와 맵핑 형태, 안 되면 「CI가 `_shared/`로 복사한다」와 복사 단계가 어느 워크플로에 붙는지. 「확인 안 됐다」 문장은 사라진다
- 시도한 명령과 결과를 회차 로그가 남긴다. 함수·설정 파일은 스파이크가 끝나면 지운다 — 남기는 것은 문서의 결론뿐이다

## 범위 밖

- `send-push` 함수 자체. 알림 task가 만든다
- CI에 `functions serve`를 붙이는 일. 안 되는 쪽으로 결론이 나면 그 복사 단계는 알림 task의 plan이 든다
