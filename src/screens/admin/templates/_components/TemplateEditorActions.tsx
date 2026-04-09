import { Button } from "#/shared/components/ui/button";

type TemplateEditorActionsProps = {
  canManageSlots: boolean;
  editingTemplateId: string | null;
  isSaving: boolean;
  onCancel: () => void;
};

export function TemplateEditorActions({
  canManageSlots,
  editingTemplateId,
  isSaving,
  onCancel,
}: Readonly<TemplateEditorActionsProps>) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled={isSaving || !canManageSlots} type="submit">
        {isSaving
          ? "저장 중..."
          : editingTemplateId
            ? "템플릿 수정"
            : "템플릿 저장"}
      </Button>

      <Button onClick={onCancel} type="button" variant="outline">
        취소
      </Button>

      <span className="text-sm text-[var(--text-subtle)]">
        {canManageSlots
          ? "저장 결과는 목록에 바로 반영됩니다."
          : "먼저 포지션 관리 화면에서 포지션을 추가해 주세요."}
      </span>
    </div>
  );
}
