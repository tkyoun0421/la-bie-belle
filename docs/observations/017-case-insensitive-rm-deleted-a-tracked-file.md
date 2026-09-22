---
status: open
target: tests/lint/file-naming.ts
date: 2026-09-23
resolved:
---

# 케이스만 다른 이름을 지우자 추적 중인 파일이 사라졌다

## 일

파일 이름 규약에 PascalCase를 들인 직후, 그 규약이 무는지 확인하려고 케이스 충돌을 일부러 만들려 했다.

```
$ cp src/shared/ui/NotBuiltYet.tsx src/shared/ui/notbuiltyet.tsx
cp: src/shared/ui/notbuiltyet.tsx and src/shared/ui/NotBuiltYet.tsx are identical (not copied)
$ rm src/shared/ui/notbuiltyet.tsx
$ cp src/shared/ui/NotBuiltYet.tsx src/shared/ui/some-widget.tsx
cp: src/shared/ui/NotBuiltYet.tsx: No such file or directory
```

macOS가 대소문자를 안 구별해서 `notbuiltyet.tsx`가 `NotBuiltYet.tsx`와 같은 파일이었다. `cp`는 「같은 파일」이라 안 만들었고, **그 뒤 `rm`이 실물을 지웠다.** 지운 것이 추적 중인 파일인 줄 모르고 다음 명령으로 넘어갔고, 그 명령이 없는 파일을 찾아서야 드러났다.

`git checkout`으로 되돌렸다. 알아챈 것은 우연이다 — 바로 다음 명령이 그 파일을 읽었다.

## 고침

검사는 이미 이 위험을 겨냥해 섰다 — `caseCollisions`가 케이스만 다른 짝을 막는다. 다만 **그 검사를 macOS에서 실물로 확인할 수 없다.** 두 파일이 동시에 존재할 수 없어서 저장소 실물 단언은 영영 초록이고, 무는지 확인하려면 케이스를 구별하는 체크아웃(리눅스 CI)이 필요하다. 지금은 유닛 픽스처가 그 로직을 덮는다.

남은 구멍은 이 관찰의 사고 자체다 — **검사는 두 파일이 커밋에 들어오는 것을 막지만, 케이스만 다른 이름을 지우다 실물을 날리는 것은 안 막는다.** 그 자리는 명령을 치는 쪽에 있고 기계가 대신할 자리가 아닐 수 있다.

## 원칙

대소문자를 안 구별하는 파일 시스템에서 케이스만 다른 이름은 **다른 파일이 아니라 같은 파일이다.** 그 이름으로 `cp`·`mv`·`rm`을 치면 대상이 내가 생각한 것과 다르다. 규약에 케이스 차원을 들이는 결정은 그 위험을 같이 들이는 결정이고, kebab-case로 통일하는 쪽이 그것을 원천에서 없앤다 — PascalCase를 고른 것은 부르는 이름과 파일 이름을 맞추려고 그 위험을 받아들인 거래다.
