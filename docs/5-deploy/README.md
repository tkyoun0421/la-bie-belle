# 5-deploy — 배포

아직 백지다. 저장소에 배포 설정이 없고 플랫폼도 정하지 않았다. 배포가 다가오면 채운다.

다룰 것: 플랫폼 선택(ADR로 정한다), 원격 Supabase 전환, 환경 변수 관리, 릴리스 절차.

## CI

- `docs/`·`.claude/`·루트 마크다운만 바뀐 PR은 뒤쪽 넷(integration·build·e2e·supabase 기동)을 건너뛴다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨진다.
- `pnpm build` 앞에서 `supabase status`의 값을 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`로 넘긴다. `NEXT_PUBLIC_*`은 빌드 시점에 번들에 박히므로 이 순서가 바뀌면 빌드는 통과하고 실행 시점에 `createSupabaseServerClient`가 던져 요청마다 500이 뜬다.
- chromium만 돈다. webkit은 `backlog.md` 후보다.

## 알아둘 것

- Wanted Sans는 CDN(jsdelivr) 의존이다. self-host가 아니라 그 서비스가 죽으면 시스템 폴백으로 떨어진다. `layout.tsx`의 `preconnect`는 지연만 줄인다.
- Supabase Free는 7일 무활동이면 프로젝트가 멈춘다 — [api/README.md](../2-design/architecture/api/README.md)가 적었다. 출시 전 스테이징이 걸린다.
