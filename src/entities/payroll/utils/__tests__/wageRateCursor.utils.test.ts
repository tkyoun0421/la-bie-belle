describe("afterWageRate — 복합 키 커서가 (profile_id, effective_date) 순서의 다음 행만 가리킨다", () => {
  it("키를 PostgREST or 필터 문자열로 만든다", async () => {
    const { afterWageRate } = await import(
      // @ts-expect-error 대상 모듈이 아직 없다
      "@/entities/payroll/utils/wageRateCursor.utils"
    );

    expect(
      afterWageRate({
        profile_id: "00000000-0000-4000-8000-000000000001",
        effective_date: "2026-03-01",
      }),
    ).toBe(
      "profile_id.gt.00000000-0000-4000-8000-000000000001,and(profile_id.eq.00000000-0000-4000-8000-000000000001,effective_date.gt.2026-03-01)",
    );
  });

  it("같은 직원이어도 시행일이 다르면 그 시행일이 필터에 들어간다", async () => {
    const { afterWageRate } = await import(
      // @ts-expect-error 대상 모듈이 아직 없다
      "@/entities/payroll/utils/wageRateCursor.utils"
    );
    const profileId = "00000000-0000-4000-8000-000000000002";

    const first = afterWageRate({
      profile_id: profileId,
      effective_date: "2026-01-01",
    });
    const second = afterWageRate({
      profile_id: profileId,
      effective_date: "2026-12-31",
    });

    expect(first).toContain("effective_date.gt.2026-01-01)");
    expect(second).toContain("effective_date.gt.2026-12-31)");
  });
});
