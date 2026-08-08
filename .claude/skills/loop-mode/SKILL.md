---
name: loop-mode
description: 토큰 리밋 자동 재개 모드 토글. /loop-mode on|off|status — 켜면 감시 supervisor가 usage 리셋 시각을 미리 저장해뒀다가 리밋으로 죽은 세션을 그 시각에 respawn한다. 끄면 자동 재개가 완전히 멈춘다.
---

# loop-mode — 리밋 자동 재개 토글

상태 파일은 `.claude/runtime/loop-state.json`, supervisor는 `scripts/claude-loop.mjs`가 정본이다. 아래 명령은 모두 저장소 루트에서 실행하고, node 호출은 다음 접두를 쓴다.

```bash
node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/claude-loop.mjs <command>
```

인자 없이 `/loop-mode`만 들어오면 `status`로 처리한다.

## on

1. `.claude/runtime/supervisor.lock`이 있는데 `pgrep -f "claude-loop.mjs start"`가 비면 스테일 락이므로 지운다. `.claude/runtime/loop-state.lock`도 남아 있으면 함께 지운다 — pid가 죽었으면 다음 상태 갱신 때 코드가 스스로 회수하지만 미리 지워도 안전하다. 프로세스가 살아 있으면 이미 켜져 있다고 보고하고 끝낸다.
2. 감시 supervisor를 터미널에서 분리해 띄운다. `--watch`는 새 작업을 만들지 않는 감시 전용 모드다.

   ```bash
   mkdir -p .claude/runtime
   nohup node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/claude-loop.mjs start --watch >> .claude/runtime/supervisor.log 2>&1 &
   ```

3. `status` 명령으로 status가 `running`·`armed`·`waiting_rate_limit` 중 하나가 됐는지 확인하고 켜졌음을 보고한다. 실패하면 `.claude/runtime/supervisor.log` 끝부분을 요약해 보고한다(원문 덤프 금지).

## off

1. `stop` 명령을 실행한다. supervisor 폴링 주기가 3초라 몇 초 안에 스스로 내려간다.
2. `pgrep -f "claude-loop.mjs start"`로 종료를 확인해 보고한다. 10초 넘게 살아 있으면 pid만 보고하고, 강제 종료는 사용자에게 묻는다.

## status

`status` 명령의 JSON에서 status·attempt·next_attempt_at·usage(5시간/7일 사용률과 리셋 시각)를 사람이 읽게 요약한다. JSON 원문을 그대로 붙이지 않는다.

## 동작 계약

감시 모드는 스스로 새 세션·새 작업을 만들지 않는다. 리밋 계열(`rate_limit`·`overloaded`)로 죽은 세션만, 저장된 리셋 시각(모르면 지수 백오프 5→10→20→30분)에 `claude respawn`으로 되살린다. 한 에피소드(직전 실패로부터 1시간 이내 연속 실패)에서 6회 넘게 실패하면 `needs_user`로 멈추고, 인증·결제 등 다른 오류는 즉시 `needs_user`다. 재시도 정책의 정본은 `harness/lib/claude-loop-state.ts`다.

자동 재개된 세션의 진행 원칙(추천안 채택, critical·high 선수정, 결과 보고서)은 `.claude/loop-unattended.md`가 정본이다. `status` 처리 때 `docs/execution/runs/loop-reports/`에 최신 보고서가 있으면 함께 안내한다.
