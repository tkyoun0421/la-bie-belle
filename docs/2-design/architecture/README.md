# architecture — 구조 설계

도메인 용어가 어떤 테이블과 API와 화면 흐름이 되는지가 산다. 개념은 `../domain/`, 시각은 `../design-system/`, 여기는 구조다.

- `data-model.md` — 테이블과 관계. 지금 정본은 `supabase/migrations/`의 실제 스키마고, 여기는 그 지도와 근거를 담는다
- `api.md` — 서버와 주고받는 경계. 경로, 입출력, 권한
- `flows.md` — 화면 사이의 흐름. 어느 화면에서 무엇을 하면 어디로 가는가
