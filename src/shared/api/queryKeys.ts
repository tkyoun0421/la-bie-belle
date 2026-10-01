/**
 * 캐시 키를 내는 팩토리 하나다. 배열 리터럴을 손으로 쓰면 같은 키가 자리마다 조금씩 다르게
 * 적히고, 쓰기가 낡게 하려던 키와 읽기가 쓰는 키가 어긋나도 타입이 안 막는다 — 화면에는
 * 「옛 값이 그대로 떠 있다」로만 보인다.
 *
 * **범위마다 항목 하나다.** 그래서 같은 튜플을 두 범위가 쓰려는 것이 정의부에서 보인다 —
 * 모양이 다른 질의 둘이 `['availability', month]`를 나눠 쓰다가 한쪽이 남의 데이터를 읽은
 * 일이 그 축이다([관찰 045](../../../docs/observations/045-two-queries-share-one-cache-key.md)).
 *
 * **`shared/api`에 사는 까닭.** 쓰기 슬라이스가 성공한 뒤 낡게 할 키는 읽기 슬라이스의
 * 것인데 `house/no-cross-slice-import`가 같은 층 슬라이스끼리 import를 막는다. 한자리에
 * 모이기 전에는 같은 상수가 네 파일에 복제돼 있었다 — `MEMBERS_KEY`가 셋, `PAYROLL_KEY`가
 * 셋이었다([ADR-015](../../../docs/2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md#파일-이름)).
 *
 * 키 꼴의 정본은 [runtime.md](../../../docs/2-design/system/runtime.md#tanstack-query-규칙)의
 * 「키는 `[도메인, 범위]`」다.
 */

/** 달 키는 날짜를 받아도 달이어야 한다 — 같은 달의 다른 날이 각자 캐시를 갖지 않는다. */
function monthOf(value: string): string {
  return value.slice(0, 7);
}

export const queryKeys = {
  schedule: {
    all: ["schedule"],
    month: (month: string) => ["schedule", month],
    /** 달력이 그리는 창이다 — 달 경계 밖 며칠을 같이 받는다. */
    monthWindow: (month: string) => ["schedule", month, "window"],
    /** 그 달 근무표의 파생이라 접두사 아래 산다 — 날을 열면 같이 낡는다. */
    openSlots: (month: string) => ["schedule", month, "open-slots"],
    /** 근무표가 처음 선 달. 달 목록의 아래끝이다. */
    firstMonth: () => ["schedule", "first-month"],
  },
  availability: {
    all: ["availability"],
    /** 전원 신청을 신청자 이름과 함께. 좁히는 것은 RLS다. */
    month: (month: string) => ["availability", month],
    /**
     * 내가 낸 날짜들. 전원 키와 모양이 달라 꼬리로 가른다 — 접두사가 겹쳐 신청을 보내면
     * 둘이 같이 낡는다.
     */
    mine: (month: string) => ["availability", month, "mine"],
  },
  attendance: {
    day: (workDate: string) => ["attendance", workDate],
    month: (month: string) => ["attendance", monthOf(month)],
  },
  excuse: {
    month: (month: string) => ["excuses", month],
  },
  request: {
    all: ["requests"],
    month: (month: string) => ["requests", month],
    /** 달로 안 가른다 — 관리자는 답할 것이 있는지를 묻지 몇 월 것인지를 묻지 않는다. */
    approvals: () => ["requests", "approvals"],
  },
  hall: {
    all: ["hall"],
    qr: () => ["hall", "qr"],
  },
  member: {
    all: ["members"],
    /** 재직·퇴사·가입 대기·차단이 이 범위로 갈린다 — 접두사 하나면 넷이 같이 낡는다. */
    list: (kind: string) => ["members", kind],
    /** 자격은 사람의 속성이라 근무표가 아니라 명단 아래 산다. */
    qualifications: () => ["members", "qualifications"],
  },
  profile: {
    all: ["profile"],
    /**
     * 표가 갈려 있어 제 키를 갖는다 — 연락처를 바꾸면 프로필 행은 그대로라 `['profile']`
     * 까지 다시 읽을 것이 없다.
     */
    private: () => ["profile", "private"],
  },
  notification: {
    all: ["notifications"],
    /** 행을 안 받는 count 질의라 범위를 따로 뗀다. */
    unread: () => ["notifications", "unread"],
  },
  payroll: {
    all: ["payroll"],
    month: (month: string) => ["payroll", monthOf(month)],
    /** 시급은 달이 없다 — 달치 급여와 같은 접두사 아래 앉아 같이 낡는다. */
    wages: () => ["payroll", "wages"],
  },
  rehearsal: {
    all: ["rehearsal"],
    mine: (month: string) => ["rehearsal", month],
    /** 관리자가 보는 전원 키. */
    everyone: (month: string) => ["rehearsal", month, "all"],
  },
} as const;

/**
 * 쓰기 하나가 같이 낡게 하는 묶음이다. 키가 아니라 무효화 정책이라 이름을 가른다 — 어느
 * 쓰기가 어느 키를 낡게 하느냐는 행위를 소유한 영역 design이 가지고, 여기 있는 것은 그
 * 결정을 코드로 옮긴 꼴뿐이다.
 *
 * `['schedule']`을 무효화하는 함수는 `['payroll']`도 무효화한다 — 급여를 배정에서
 * 계산하기 때문이고 그 규칙은 [runtime.md](../../../docs/2-design/system/runtime.md#무효화-표)에 있다.
 */
export const staleTogether = {
  /** 날을 여닫고 자리를 고치고 확정하는 판정이 든다. */
  scheduleWrite: [
    queryKeys.schedule.all,
    queryKeys.payroll.all,
    queryKeys.request.all,
  ],
  /**
   * 리허설은 `['schedule']`을 안 건드린다 — 배정도 근무 시간도 안 바뀌는데 근무표를 다시
   * 읽을 이유가 없다. 급여는 리허설 시간을 더하므로 같이 낡는다.
   */
  rehearsalWrite: [queryKeys.rehearsal.all, queryKeys.payroll.all],
} as const;
