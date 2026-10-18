export function rootGateOf({
  configured,
}: {
  configured: boolean;
}): "app" | "unavailable" {
  return configured ? "app" : "unavailable";
}
