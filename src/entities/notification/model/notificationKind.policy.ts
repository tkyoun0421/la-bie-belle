import { memberOf } from "@/shared/model/memberOf.policy";
import { NOTIFICATION_KINDS } from "@/entities/notification/consts/notification.const";

export const isNotificationKind = memberOf(NOTIFICATION_KINDS);
