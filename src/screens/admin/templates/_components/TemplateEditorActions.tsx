import { InlineSpinner } from "#/shared/components/common/InlineSpinner";
import { Button } from "#/shared/components/ui/button";

type TemplateEditorActionsProps = {
  canManageSlots: boolean;
  editingTemplateId: string | null;
  isSaving: boolean;
  onCancel: () => void;
  serverError: string | null;
};

export function TemplateEditorActions({
  canManageSlots,
  editingTemplateId,
  isSaving,
  onCancel,
  serverError,
}: Readonly<TemplateEditorActionsProps>) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Button disabled={isSaving || !canManageSlots} type="submit">
        {isSaving ? (
          <span className="inline-flex items-center gap-1.5">
            저장 중
            <InlineSpinner />
          </span>
        ) : editingTemplateId ? (
          "템플릿 수정"
        ) : (
          "템플릿 저장"
        )}
      </Button>

      <Button onClick={onCancel} type="button" variant="outline">
        취소
      </Button>

      <span
        className={
          serverError
            ? "text-sm font-medium text-[var(--destructive)]"
            : "text-sm text-[var(--text-subtle)]"
        }
      >
        {serverError
          ? serverError
          : canManageSlots
            ? "저장 결과는 목록에 바로 반영됩니다."
            : "먼저 포지션 관리 화면에서 포지션을 추가해 주세요."}
      </span>
    </div>
  );
}
