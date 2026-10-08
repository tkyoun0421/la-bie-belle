import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { DragProvider } from "@/shared/ui/DragProvider";
import { DropZone } from "@/shared/ui/DropZone";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Switch } from "@/shared/ui/Switch";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import { useDayDetail } from "@/screens/scheduleAdmin/hooks/useDayDetail";
import type { DayDetailInput } from "@/screens/scheduleAdmin/model/dayDetail.type";
import { AdjustChoiceSheet } from "@/screens/scheduleAdmin/ui/AdjustChoiceSheet";
import { AdjustSheet } from "@/screens/scheduleAdmin/ui/AdjustSheet";
import { ConfirmChangeSheet } from "@/screens/scheduleAdmin/ui/ConfirmChangeSheet";
import { DiscardSlotSheet } from "@/screens/scheduleAdmin/ui/DiscardSlotSheet";
import { PersonPickerSheet } from "@/screens/scheduleAdmin/ui/PersonPickerSheet";
import { PersonSheet } from "@/screens/scheduleAdmin/ui/PersonSheet";
import { PositionRow } from "@/screens/scheduleAdmin/ui/PositionRow";
import { QualificationSheet } from "@/screens/scheduleAdmin/ui/QualificationSheet";
import { SlotSheet } from "@/screens/scheduleAdmin/ui/SlotSheet";
import { DISCARD_DROP_ID } from "@/screens/scheduleAdmin/utils/dragId.utils";

export const SCHEDULE_HOLIDAY_SWITCH_TEST_ID = "schedule-holiday-switch";

export type DayDetailProps = DayDetailInput & {
  onBack: () => void;
};

export function DayDetail({ onBack, ...input }: DayDetailProps) {
  const day = useDayDetail(input);

  return (
    <>
      <AppBar
        title={day.title}
        onBack={onBack}
        right={
          <Text size="sm" tone="muted" numeric>
            {day.fillLabel}
          </Text>
        }
      />

      <DragProvider canDrop={day.canDrop} onDrop={day.drop}>
        <ScrollView>
          <View className="gap-3 px-5 pb-8">
            <Card className="py-0">
              {day.showHours ? (
                <ListRow title={day.hoursLine} onPress={input.onPressHours} />
              ) : null}

              <View className="flex-row items-center gap-3 py-3">
                <View className="flex-1">
                  <Text size="base" weight="medium">
                    {SCHEDULE_ADMIN_COPY.holidayLabel}
                  </Text>
                  <Text size="xs" tone="subtle" className="mt-0.5">
                    {day.holiday.helperLine}
                  </Text>
                </View>
                <Switch
                  testID={SCHEDULE_HOLIDAY_SWITCH_TEST_ID}
                  value={day.holiday.checked}
                  disabled={day.holiday.locked}
                  onValueChange={input.onSetHoliday}
                />
              </View>

              <ListRow
                title={SCHEDULE_ADMIN_COPY.adjustLabel}
                right={
                  <Text size="xs" tone="subtle" numeric>
                    {day.adjustmentLine}
                  </Text>
                }
                chevron
                className="py-3"
                onPress={day.openAdjust}
              />

              {day.showApplications ? (
                <ListRow title={day.applicationsLine} chevron={false} />
              ) : null}
            </Card>

            <View>
              {day.positions.map((row) => (
                <PositionRow key={row.position} {...row} />
              ))}
            </View>

            {day.showCloseDay ? (
              <Button variant="secondary" onPress={input.onCloseDay}>
                {SCHEDULE_ADMIN_COPY.closeDay}
              </Button>
            ) : null}
          </View>
        </ScrollView>

        <DropZone
          id={DISCARD_DROP_ID}
          label={SCHEDULE_ADMIN_COPY.discardZoneLabel}
          activeLabel={SCHEDULE_ADMIN_COPY.discardZoneActiveLabel}
        />
      </DragProvider>

      {day.picker === null ? null : (
        <SheetLayer onDismiss={day.picker.close}>
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
        </SheetLayer>
      )}

      {day.person === null ? null : (
        <SheetLayer onDismiss={day.person.close}>
          <PersonSheet
            name={day.person.name}
            photoUrl={day.person.photoUrl}
            gender={day.person.gender}
            birthDate={day.person.birthDate}
            qualifications={day.person.qualifications}
          />
        </SheetLayer>
      )}

      {day.qualification === null ? null : (
        <SheetLayer onDismiss={day.qualification.close}>
          <QualificationSheet
            name={day.qualification.name}
            position={day.qualification.position}
            onOnce={day.qualification.once}
            onGrant={day.qualification.grant}
            onClose={day.qualification.close}
          />
        </SheetLayer>
      )}

      {day.slotSheet === null ? null : (
        <SheetLayer onDismiss={day.slotSheet.close}>
          <SlotSheet
            confirmed={day.slotSheet.confirmed}
            merged={day.slotSheet.merged}
            onReplace={day.slotSheet.replace}
            onSplit={day.slotSheet.split}
            onRemove={day.slotSheet.remove}
            onClose={day.slotSheet.close}
          />
        </SheetLayer>
      )}

      {day.adjust === null ? null : (
        <SheetLayer onDismiss={day.adjust.close}>
          <AdjustSheet
            head={day.adjust.head}
            rows={day.adjust.rows}
            onPickPerson={day.adjust.pickPerson}
          />
        </SheetLayer>
      )}

      {day.choice === null ? null : (
        <SheetLayer onDismiss={day.choice.close}>
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
        </SheetLayer>
      )}

      {day.confirmChange === null ? null : (
        <SheetLayer onDismiss={day.confirmChange.close}>
          <ConfirmChangeSheet
            copy={day.confirmChange.copy}
            saving={day.confirmChange.saving}
            onClose={day.confirmChange.close}
            onConfirm={day.confirmChange.confirm}
          />
        </SheetLayer>
      )}

      {day.discard === null ? null : (
        <SheetLayer onDismiss={day.discard.close}>
          <DiscardSlotSheet
            name={day.discard.name}
            removing={day.discard.removing}
            onCancel={day.discard.close}
            onConfirm={day.discard.confirm}
          />
        </SheetLayer>
      )}

      {day.toast === null ? null : (
        <FloatingToast
          kind="info"
          message={day.toast}
          onDone={day.dismissToast}
        />
      )}
    </>
  );
}
