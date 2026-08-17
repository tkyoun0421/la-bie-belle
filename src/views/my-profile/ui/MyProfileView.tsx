import { resolveEffectiveWage } from "@/entities/identity/model/wage";
import type { OwnWorkerInfo } from "@/entities/identity/types/worker";
import type { OwnPhoneOutcome } from "@/features/my-profile/hooks/useOwnPhoneForm";
import type { OwnWageOutcome } from "@/features/my-profile/hooks/useOwnWageForm";
import { OwnPhoneForm } from "@/features/my-profile/ui/OwnPhoneForm";
import { OwnWageForm } from "@/features/my-profile/ui/OwnWageForm";
import { genderLabel } from "@/views/my-profile/model/gender-label";

type MyProfileViewProps = {
  info: OwnWorkerInfo;
  onUpdatePhone: (phone: string) => Promise<OwnPhoneOutcome>;
  onSetWage: (hourlyWage: number) => Promise<OwnWageOutcome>;
};

export function MyProfileView({ info, onUpdatePhone, onSetWage }: MyProfileViewProps) {
  const effectiveWage = resolveEffectiveWage(info.hourlyWage, info.defaultHourlyWage);

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-nav-safe">
      <h1 className="typo-headline-md text-text-strong">내 정보</h1>
      <section className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border py-3">
          <span className="typo-body text-text">이름</span>
          <span className="typo-body text-text-strong">{info.name}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border py-3">
          <span className="typo-body text-text">성별</span>
          <span className="typo-body text-text-strong">{genderLabel(info.gender)}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border py-3">
          <span className="typo-body text-text">생년월일</span>
          <span className="typo-body text-text-strong">{info.birthDate}</span>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="typo-title text-text-strong">휴대폰 번호</h2>
        <OwnPhoneForm action={onUpdatePhone} initialPhone={info.phone} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="typo-title text-text-strong">시급</h2>
        <OwnWageForm
          action={onSetWage}
          initialAmount={effectiveWage.amount}
          isDerived={effectiveWage.isDerived}
        />
      </section>
    </main>
  );
}
