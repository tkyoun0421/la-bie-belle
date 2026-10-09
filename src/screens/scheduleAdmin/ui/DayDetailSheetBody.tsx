import { AdjustChoiceSheet } from "@/features/adjustment/ui/AdjustChoiceSheet";
import { AdjustSheet } from "@/features/adjustment/ui/AdjustSheet";
import { QualificationSheet } from "@/features/qualificationGrant/ui/QualificationSheet";
import { PersonPickerSheet } from "@/features/scheduleAssign/ui/PersonPickerSheet";
import { PersonSheet } from "@/features/scheduleAssign/ui/PersonSheet";
import { ConfirmChangeSheet } from "@/features/scheduleConfirm/ui/ConfirmChangeSheet";
import { DiscardSlotSheet } from "@/features/scheduleSlot/ui/DiscardSlotSheet";
import { SlotSheet } from "@/features/scheduleSlot/ui/SlotSheet";
import type {
  DayDetailController,
  DayDetailSheetKind,
} from "@/screens/scheduleAdmin/model/dayDetail.type";

export type DayDetailSheetBodyProps = {
  day: DayDetailController;
  kind: DayDetailSheetKind;
};

export function DayDetailSheetBody({ day, kind }: DayDetailSheetBodyProps) {
  if (kind === "picker" && day.picker !== null) {
    return (
      <PersonPickerSheet
        title={day.picker.title}
        entries={day.picker.entries}
        expanded={day.picker.expanded}
        picked={day.picker.picked}
        sending={day.picker.sending}
        onExpand={day.picker.expand}
        onPick={day.picker.pick}
        onInspect={day.picker.inspect}
        onToggle={day.picker.toggle}
        onSend={day.picker.send}
      />
    );
  }

  if (kind === "person" && day.person !== null) {
    return (
      <PersonSheet
        name={day.person.name}
        photoUrl={day.person.photoUrl}
        gender={day.person.gender}
        birthDate={day.person.birthDate}
        qualifications={day.person.qualifications}
      />
    );
  }

  if (kind === "qualification" && day.qualification !== null) {
    return (
      <QualificationSheet
        name={day.qualification.name}
        position={day.qualification.position}
        onOnce={day.qualification.once}
        onGrant={day.qualification.grant}
        onClose={day.qualification.close}
      />
    );
  }

  if (kind === "slot" && day.slotSheet !== null) {
    return (
      <SlotSheet
        confirmed={day.slotSheet.confirmed}
        merged={day.slotSheet.merged}
        onReplace={day.slotSheet.replace}
        onSplit={day.slotSheet.split}
        onRemove={day.slotSheet.remove}
        onClose={day.slotSheet.close}
      />
    );
  }

  if (kind === "adjust" && day.adjust !== null) {
    return (
      <AdjustSheet
        head={day.adjust.head}
        rows={day.adjust.rows}
        onPickPerson={day.adjust.pickPerson}
      />
    );
  }

  if (kind === "choice" && day.choice !== null) {
    return (
      <AdjustChoiceSheet
        name={day.choice.name}
        assignedMinutes={day.choice.assignedMinutes}
        canRevert={day.choice.canRevert}
        extending={day.choice.extending}
        digits={day.choice.digits}
        canSend={day.choice.canSend}
        sending={day.choice.sending}
        failureMessage={day.choice.failureMessage}
        onAbsent={day.choice.absent}
        onRevert={day.choice.revert}
        onStartExtending={day.choice.startExtending}
        onWriteDigits={day.choice.writeDigits}
        onExtend={day.choice.extend}
        onClose={day.choice.close}
      />
    );
  }

  if (kind === "confirmChange" && day.confirmChange !== null) {
    return (
      <ConfirmChangeSheet
        copy={day.confirmChange.copy}
        saving={day.confirmChange.saving}
        onClose={day.confirmChange.close}
        onConfirm={day.confirmChange.confirm}
      />
    );
  }

  if (kind === "discard" && day.discard !== null) {
    return (
      <DiscardSlotSheet
        name={day.discard.name}
        removing={day.discard.removing}
        onCancel={day.discard.close}
        onConfirm={day.discard.confirm}
      />
    );
  }

  return null;
}
