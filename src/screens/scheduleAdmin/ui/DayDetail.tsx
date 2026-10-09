import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { DragProvider } from "@/shared/ui/DragProvider";
import { DropZone } from "@/shared/ui/DropZone";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Text } from "@/shared/ui/Text";
import {
  DISCARD_DROP_ID,
  SCHEDULE_ADMIN_COPY,
} from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import { useDayDetail } from "@/screens/scheduleAdmin/hooks/useDayDetail";
import type { DayDetailInput } from "@/screens/scheduleAdmin/model/dayDetail.type";
import { DayDetailCard } from "@/screens/scheduleAdmin/ui/DayDetailCard";
import { DayDetailSheets } from "@/screens/scheduleAdmin/ui/DayDetailSheets";
import { PositionRow } from "@/screens/scheduleAdmin/ui/PositionRow";

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
            <DayDetailCard
              day={day}
              onPressHours={input.onPressHours}
              onSetHoliday={input.onSetHoliday}
            />

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

      <DayDetailSheets day={day} />

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
