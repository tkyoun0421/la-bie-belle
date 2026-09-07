---
status: open
target: .claude/agents/implementer.md
date: 2026-09-07
resolved:
---

# 막혔다는 보고가 렌더 확인 없이 일반론에서 나왔다

## 일

login-screens 회차에서 implementer가 구글 버튼 로고를 「배포 SVG가 foreignObject 안 conic-gradient라 `<img>`·CSS로는 안 그려진다」며 미완으로 보고했다. 뒤에 태관 결정으로 재시도했더니 chromium·webkit·firefox 세 엔진 다 정상으로 그렸고, viewBox 크롭 한 번으로 끝났다. 첫 보고는 렌더를 실제로 돌려보지 않고 「SVG는 이미지 컨텍스트에서 foreignObject를 안 그린다」는 일반론으로 단정한 것이었다. 그 한 줄 때문에 로고가 한 라운드 밀렸고, 웹 조사와 태관 결정 한 차례가 낭비됐다. implementer 스스로 이 어긋남을 다음 라운드 보고에서 밝혔다.

## 고침

implementer 정의문에 한 조항을 더한다: 무엇이 「안 된다」고 보고하려면 그 안 됨을 실제 실행(렌더·빌드·호출)으로 확인한 결과여야 한다. 기억이나 일반론으로 단정한 막힘은 보고 전에 한 번 돌려본다.

## 원칙

기계가 몇 초에 확인할 수 있는 사실을 추론으로 대신하면, 틀렸을 때 사람 결정 한 차례가 통째로 낭비된다.
