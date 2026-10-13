export type NotificationSwitch = {
  enabled: boolean;
  isPending: boolean;
  turnOn: () => void;
  turnOff: () => void;
};
