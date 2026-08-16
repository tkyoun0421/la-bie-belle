export type PushPrimingInput = {
  applicationSaved: boolean;
  subscribed: boolean;
  permissionDenied: boolean;
  alreadyShown: boolean;
};

export function shouldShowPushPriming(input: PushPrimingInput): boolean {
  return (
    input.applicationSaved && !input.subscribed && !input.permissionDenied && !input.alreadyShown
  );
}
