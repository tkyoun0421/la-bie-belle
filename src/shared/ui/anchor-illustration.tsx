import { useId } from "react";

export type IllustrationName =
  | "schedule-confirmed"
  | "vacancy"
  | "assignment-changed"
  | "change-approved"
  | "change-rejected"
  | "pay-last-week"
  | "pay-month-total"
  | "pay-cumulative";

type AnchorIllustrationProps = {
  name: IllustrationName;
  size: 28 | 32;
};

export function AnchorIllustration({ name, size }: AnchorIllustrationProps) {
  const uid = useId();

  switch (name) {
    case "schedule-confirmed":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`paper-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e8ecf1" />
            </linearGradient>
            <linearGradient id={`blue-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5b90ff" />
              <stop offset="1" stopColor="#0b3f9e" />
            </linearGradient>
          </defs>
          <rect
            x="5"
            y="7.5"
            width="26"
            height="23"
            rx="4.5"
            fill={`url(#paper-${uid})`}
            stroke="#dfe3e9"
            strokeWidth="0.8"
          />
          <path
            d="M5 12A4.5 4.5 0 0 1 9.5 7.5h17A4.5 4.5 0 0 1 31 12v2.4H5z"
            fill={`url(#blue-${uid})`}
          />
          <path
            d="m11.5 22.5 3.8 3.8 8.2-8.6"
            fill="none"
            stroke="#0052ff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "vacancy":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd971" />
              <stop offset="1" stopColor="#e79f22" />
            </linearGradient>
            <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5d4835" />
              <stop offset="1" stopColor="#33261a" />
            </linearGradient>
            <linearGradient id={`green-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#54d787" />
              <stop offset="1" stopColor="#11834a" />
            </linearGradient>
          </defs>
          <path
            d="M25.6 24.4 29.8 13"
            fill="none"
            stroke={`url(#skin-${uid})`}
            strokeWidth="4.8"
            strokeLinecap="round"
          />
          <circle cx="30.4" cy="9.6" r="3.9" fill={`url(#skin-${uid})`} />
          <path
            d="M18 22.6c5.9 0 10.7 4.2 10.7 9.4V34a2 2 0 0 1-2 2H9.3a2 2 0 0 1-2-2v-2c0-5.2 4.8-9.4 10.7-9.4"
            fill={`url(#green-${uid})`}
          />
          <circle cx="18" cy="15" r="7.2" fill={`url(#skin-${uid})`} />
          <path
            d="M10.8 15.2c0-4.6 3.2-7.8 7.2-7.8s7.2 3.2 7.2 7.8c-1.8-2.3-4.2-3.4-7.2-3.4s-5.4 1.1-7.2 3.4"
            fill={`url(#hair-${uid})`}
          />
          <circle cx="15.2" cy="16.2" r="1.15" fill="#3f2f21" />
          <circle cx="20.8" cy="16.2" r="1.15" fill="#3f2f21" />
          <path
            d="M16.2 19.4a2.6 2.6 0 0 0 3.6 0"
            fill="none"
            stroke="#3f2f21"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "assignment-changed":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`amber-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffc94d" />
              <stop offset="1" stopColor="#c4700a" />
            </linearGradient>
          </defs>
          <path
            d="M7.5 18a10.5 10.5 0 0 1 17.8-7.6"
            fill="none"
            stroke={`url(#amber-${uid})`}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path
            d="M28.5 18a10.5 10.5 0 0 1-17.8 7.6"
            fill="none"
            stroke={`url(#amber-${uid})`}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path d="M24.2 4.5 30 11.2l-8.2 1.2z" fill={`url(#amber-${uid})`} />
          <path d="M11.8 31.5 6 24.8l8.2-1.2z" fill={`url(#amber-${uid})`} />
        </svg>
      );
    case "change-approved":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`green-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#54d787" />
              <stop offset="1" stopColor="#11834a" />
            </linearGradient>
          </defs>
          <rect x="5" y="7.5" width="26" height="23" rx="4.5" fill={`url(#green-${uid})`} />
          <path
            d="m11.5 22.5 3.8 3.8 8.2-8.6"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "change-rejected":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`gray-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c9d1dc" />
              <stop offset="1" stopColor="#7c828a" />
            </linearGradient>
          </defs>
          <rect x="5" y="7.5" width="26" height="23" rx="4.5" fill={`url(#gray-${uid})`} />
          <path
            d="M11.5 19h13"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pay-last-week":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`green-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#54d787" />
              <stop offset="1" stopColor="#11834a" />
            </linearGradient>
          </defs>
          <rect x="4" y="9.5" width="28" height="17" rx="3" fill={`url(#green-${uid})`} />
          <rect
            x="6.6"
            y="12.1"
            width="22.8"
            height="11.8"
            rx="1.6"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.55"
          />
          <circle cx="18" cy="18" r="5.2" fill="#eafaf0" />
          <path
            d="M15.2 15.6 16.5 20.4 18 16.7 19.5 20.4 20.8 15.6"
            fill="none"
            stroke="#0d6b3c"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.6 17.7h6.8"
            fill="none"
            stroke="#0d6b3c"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pay-month-total":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`amber-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffc94d" />
              <stop offset="1" stopColor="#c4700a" />
            </linearGradient>
            <linearGradient id={`blue-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5b90ff" />
              <stop offset="1" stopColor="#0b3f9e" />
            </linearGradient>
            <linearGradient id={`green-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#54d787" />
              <stop offset="1" stopColor="#11834a" />
            </linearGradient>
          </defs>
          <rect x="5" y="17.5" width="6.8" height="13" rx="2.4" fill={`url(#amber-${uid})`} />
          <rect x="14.6" y="8" width="6.8" height="22.5" rx="2.4" fill={`url(#blue-${uid})`} />
          <rect x="24.2" y="13" width="6.8" height="17.5" rx="2.4" fill={`url(#green-${uid})`} />
        </svg>
      );
    case "pay-cumulative":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id={`violet-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b18cff" />
              <stop offset="1" stopColor="#6a3bd8" />
            </linearGradient>
          </defs>
          <path
            d="M6.5 27.5 13.5 20 18.5 23.5 25 15.5"
            fill="none"
            stroke={`url(#violet-${uid})`}
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M30.4 9 23 10.6 28 15.6z" fill="#6a3bd8" />
        </svg>
      );
  }
}
