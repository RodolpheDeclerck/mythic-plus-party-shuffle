'use client';

/** Adapted from legacy v0 wow-icons. */
export function BloodlustIcon({
  className = 'h-4 w-4',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2c0 4-3 6-3 10 0 3 1.5 5 3 6 1.5-1 3-3 3-6 0-4-3-6-3-10z"
        fill="#ef4444"
        stroke="#fbbf24"
        strokeWidth="0.5"
      />
      <path
        d="M12 6c0 2-1.5 3-1.5 5.5 0 1.5 0.75 2.5 1.5 3 0.75-0.5 1.5-1.5 1.5-3 0-2.5-1.5-3.5-1.5-5.5z"
        fill="#f97316"
      />
      <path
        d="M12 9c0 1-0.75 1.5-0.75 3 0 0.8 0.4 1.3 0.75 1.5 0.35-0.2 0.75-0.7 0.75-1.5 0-1.5-0.75-2-0.75-3z"
        fill="#fbbf24"
      />
      <path
        d="M7 8c0 2-1.5 3-1.5 5 0 1.5 0.75 2.5 1.5 3 0.75-0.5 1.5-1.5 1.5-3 0-2-1.5-3-1.5-5z"
        fill="#f97316"
        stroke="#fbbf24"
        strokeWidth="0.3"
      />
      <path
        d="M17 8c0 2-1.5 3-1.5 5 0 1.5 0.75 2.5 1.5 3 0.75-0.5 1.5-1.5 1.5-3 0-2-1.5-3-1.5-5z"
        fill="#f97316"
        stroke="#fbbf24"
        strokeWidth="0.3"
      />
    </svg>
  );
}

export function BattleRezIcon({
  className = 'h-4 w-4',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 12 C10 10, 6 8, 3 6 C5 9, 6 11, 6 14 C6 16, 7 18, 9 19 C10 17, 11 14, 12 12z"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M4 7 C5.5 9, 6.5 11, 7 14"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M5 9 C6 11, 7 13, 7.5 15"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M6 11 C7 13, 8 15, 8.5 17"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M12 12 C14 10, 18 8, 21 6 C19 9, 18 11, 18 14 C18 16, 17 18, 15 19 C14 17, 13 14, 12 12z"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M20 7 C18.5 9, 17.5 11, 17 14"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M19 9 C18 11, 17 13, 16.5 15"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M18 11 C17 13, 16 15, 15.5 17"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill="#4ade80" opacity="0.6" />
      <circle cx="12" cy="12" r="1" fill="#22c55e" />
    </svg>
  );
}
