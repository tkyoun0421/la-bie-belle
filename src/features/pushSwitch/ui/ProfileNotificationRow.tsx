import { Dialog } from "@/shared/ui/Dialog";
import { ListRow } from "@/shared/ui/ListRow";
import { PushNotice } from "@/shared/ui/PushNotice";
import { Switch } from "@/shared/ui/Switch";
import { NOTIFICATION_SWITCH_COPY } from "@/features/pushSwitch/consts/pushSwitch.const";
import { useProfileNotificationRow } from "@/features/pushSwitch/hooks/useProfileNotificationRow";

export type ProfileNotificationRowProps = {
  enabled: boolean | null;
};

export function ProfileNotificationRow({
  enabled,
}: ProfileNotificationRowProps) {
  const fragment = useProfileNotificationRow(enabled);

  if (fragment.row.kind === "notice") {
    return (
      <PushNotice
        className="my-4"
        tone="denied"
        title={fragment.row.title}
        subline={fragment.row.subline}
      />
    );
  }

  return (
    <>
      <ListRow
        title={NOTIFICATION_SWITCH_COPY.label}
        right={
          <Switch
            testID="notification-switch"
            value={fragment.on}
            disabled={fragment.row.state === "locked"}
            onValueChange={fragment.flip}
          />
        }
      />

      <Dialog
        visible={fragment.asking}
        title={NOTIFICATION_SWITCH_COPY.turnOffTitle}
        closeLabel={NOTIFICATION_SWITCH_COPY.turnOffClose}
        confirmLabel={NOTIFICATION_SWITCH_COPY.turnOffConfirm}
        onClose={fragment.cancelTurnOff}
        onConfirm={fragment.confirmTurnOff}
      >
        {NOTIFICATION_SWITCH_COPY.turnOffNote}
      </Dialog>
    </>
  );
}
