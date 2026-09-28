---
status: open
target: src/shared/ui/DraggableSheet.tsx
date: 2026-09-28
---

# 시트 손잡이를 문서는 그리라 하고 조각은 지운다

## 일

`stats-admin` 구현자가 「시트에 손잡이가 없다」를 판정 요청으로 올렸다. 문서를 훑으니 손잡이를 그리라고 적은 자리가 넷이다 — [check-in.md](../2-design/modules/attendance/screens/check-in.md)는 색(`stroke.neutral-muted`)과 크기(`w-8` `h-1` `rounded-full`)까지, [excuse.md](../2-design/modules/attendance/screens/excuse.md)는 같은 토큰에 「손잡이와 시트의 네 모서리가 그 자리에 그대로 있어서」라는 이유까지, [stats.md](../2-design/system/screens/stats.md)와 [approvals.md](../2-design/system/screens/approvals.md)는 구성 목록과 닫는 길에 적어뒀다.

조각은 반대로 간다. `DraggableSheet.tsx`가 `handleComponent={null}`이고 주석이 「손잡이도 지운다: 이 디렉터리가 시트 위에 손잡이를 두라고 한 적이 없다」다. 그 주석이 쓰인 시점에 페이지 문서 넷이 이미 손잡이를 적고 있었다 — 조각을 짓는 손이 `design-system/`만 보고 `screens/`와 `modules/*/screens/`를 안 봤다.

한쪽만 고치면 나머지 셋과 어긋난다. `stats-admin`은 손잡이 없는 채로 두고 조각을 고치는 쪽을 task로 세운다.

## 볼 자리

조각이 페이지 문서를 안 보는 것이 뿌리다. `design-system/components.md`가 바텀시트 절에서 손잡이를 안 적었고, 조각은 그 절만 정본으로 읽었다. 조각의 정본은 `design-system/`이 맞지만 페이지 문서 넷이 같은 값을 적었으면 그것이 `design-system/`에 없다는 것 자체가 빠진 자리다.

`sian-auditor`는 문서와 시안을 대조하지 조각과는 안 댄다. 문서가 적은 토큰이 조각에 서 있는지를 보는 눈이 없다.

## 원칙

조각이 제 정본만 읽으면 그 정본이 못 적은 자리는 영영 안 선다. 페이지 문서가 같은 값을 여러 번 적고 있으면 그 값은 조각의 정본으로 올라갈 때가 된 것이다.
