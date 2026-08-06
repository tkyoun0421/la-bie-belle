import { cn } from "@/shared/lib/cn";

type ConnectivityBannerProps = {
  status: "offline" | "recovered" | "online";
  className?: string;
};

export function ConnectivityBanner({ status, className }: ConnectivityBannerProps) {
  if (status === "online") {
    return null;
  }

  const isOffline = status === "offline";

  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-4 py-2 text-center typo-label",
        isOffline ? "bg-warning-surface text-warning" : "bg-success-surface text-success",
        className,
      )}
    >
      {isOffline ? "인터넷 연결이 끊겼어요" : "최신 내용을 불러왔어요"}
    </div>
  );
}
