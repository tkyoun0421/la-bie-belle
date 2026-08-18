import type { AppTabKey } from "@/shared/config/app-tabs.config";

type TabIconProps = {
  name: AppTabKey;
  active: boolean;
  className?: string;
};

const STROKE_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TabIcon({ name, active, className }: TabIconProps) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className}>
          {active ? (
            <path
              fill="currentColor"
              d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z"
            />
          ) : (
            <>
              <path {...STROKE_PROPS} d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
              <path {...STROKE_PROPS} d="M9.5 21v-6h5v6" />
            </>
          )}
        </svg>
      );
    case "schedule":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className}>
          {active ? (
            <path
              fill="currentColor"
              d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m2.5 9.5h3v3h-3zm6 0h3v3h-3z"
            />
          ) : (
            <>
              <rect {...STROKE_PROPS} x="3" y="5" width="18" height="16" rx="2" />
              <path {...STROKE_PROPS} d="M8 3v4M16 3v4M3 11h18" />
            </>
          )}
        </svg>
      );
    case "pay":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className}>
          {active ? (
            <path
              fill="currentColor"
              d="M4.5 6h15A2.5 2.5 0 0 1 22 8.5v7A2.5 2.5 0 0 1 19.5 18h-15A2.5 2.5 0 0 1 2 15.5v-7A2.5 2.5 0 0 1 4.5 6m11 6.5h3v2h-3z"
            />
          ) : (
            <>
              <rect {...STROKE_PROPS} x="2.5" y="6" width="19" height="13" rx="2.5" />
              <path {...STROKE_PROPS} d="M2.5 11h19M17 15h2" />
            </>
          )}
        </svg>
      );
    case "more":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className}>
          {active ? (
            <path
              fill="currentColor"
              d="M4 3.5h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5m10 0h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5M4 13.5h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5m10 0h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5"
            />
          ) : (
            <>
              <rect {...STROKE_PROPS} x="3.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect {...STROKE_PROPS} x="13.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect {...STROKE_PROPS} x="3.5" y="13.5" width="7" height="7" rx="1.5" />
              <rect {...STROKE_PROPS} x="13.5" y="13.5" width="7" height="7" rx="1.5" />
            </>
          )}
        </svg>
      );
  }
}
