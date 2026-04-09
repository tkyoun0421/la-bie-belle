import { Alert, AlertDescription } from "#/shared/components/ui/alert";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import { Input } from "#/shared/components/ui/input";
import { Label } from "#/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/shared/components/ui/select";
import { positionAllowedGenderOptions } from "#/entities/positions/models/constants/allowedGender";
import {
  positionAllowedGenderSchema,
  type PositionAllowedGender,
} from "#/entities/positions/models/schemas/position";

type PositionEditorCardProps = {
  allowedGender: PositionAllowedGender;
  defaultRequiredCount: number;
  error: string | null;
  isEditing: boolean;
  isSaving: boolean;
  name: string;
  onAllowedGenderChange: (value: PositionAllowedGender) => void;
  onCancel: () => void;
  onDefaultRequiredCountChange: (value: number) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
};

export function PositionEditorCard({
  allowedGender,
  defaultRequiredCount,
  error,
  isEditing,
  isSaving,
  name,
  onAllowedGenderChange,
  onCancel,
  onDefaultRequiredCountChange,
  onNameChange,
  onSubmit,
}: Readonly<PositionEditorCardProps>) {
  return (
    <Card className="bg-white shadow-xl">
      <CardHeader>
        <CardTitle>{isEditing ? "포지션 수정" : "새 포지션 추가"}</CardTitle>
        <CardDescription>
          포지션 이름, 가능 성별, 기본 필수 인원을 설정합니다. 여기서 정한 기본
          인원은 템플릿 슬롯 기본값으로 사용됩니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="grid gap-2">
            <Label>포지션 이름</Label>
            <Input
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="예: 안내"
              value={name}
            />
          </label>

          <label className="grid gap-2">
            <Label>가능 성별</Label>
            <Select
              onValueChange={(value) => {
                const parsed = positionAllowedGenderSchema.safeParse(value);
                if (parsed.success) {
                  onAllowedGenderChange(parsed.data);
                }
              }}
              value={allowedGender}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="가능 성별 선택" />
              </SelectTrigger>
              <SelectContent>
                {positionAllowedGenderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-2">
            <Label>기본 필수 인원</Label>
            <Input
              min="1"
              onChange={(event) =>
                onDefaultRequiredCountChange(
                  Number.isFinite(event.target.valueAsNumber)
                    ? event.target.valueAsNumber
                    : 0
                )
              }
              type="number"
              value={defaultRequiredCount}
            />
          </label>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={isSaving} type="submit">
              {isSaving
                ? "저장 중..."
                : isEditing
                  ? "포지션 수정"
                  : "포지션 저장"}
            </Button>
            <Button onClick={onCancel} type="button" variant="outline">
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
