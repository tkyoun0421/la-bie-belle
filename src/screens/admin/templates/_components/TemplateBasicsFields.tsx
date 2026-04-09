import { Input } from "#/shared/components/ui/input";
import type {
  TemplateFieldName,
  TemplateFormState,
} from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateField } from "#/screens/admin/templates/_components/TemplateField";

type TemplateBasicsFieldsProps = {
  formState: TemplateFormState;
  onFieldChange: (field: TemplateFieldName, value: string) => void;
};

export function TemplateBasicsFields({
  formState,
  onFieldChange,
}: Readonly<TemplateBasicsFieldsProps>) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <TemplateField label="템플릿 이름">
        <Input
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="예: 주일 프리미엄 웨딩"
          value={formState.name}
        />
      </TemplateField>
      <TemplateField label="첫 서비스 시작">
        <Input
          onChange={(event) =>
            onFieldChange("firstServiceAt", event.target.value)
          }
          type="time"
          value={formState.firstServiceAt}
        />
      </TemplateField>
      <TemplateField label="마지막 서비스 종료">
        <Input
          onChange={(event) =>
            onFieldChange("lastServiceEndAt", event.target.value)
          }
          type="time"
          value={formState.lastServiceEndAt}
        />
      </TemplateField>
    </div>
  );
}
