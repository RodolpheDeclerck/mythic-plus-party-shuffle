import type { CSSProperties } from 'react';

/** Default `public/background.png` (void/portal art), or `NEXT_PUBLIC_LOGIN_BACKGROUND_URL`. */
export const loginBackgroundImageUrl =
  process.env.NEXT_PUBLIC_LOGIN_BACKGROUND_URL?.trim() || '/background.png';

/** Escape quotes for a safe `url('…')` CSS value. */
export function loginBackgroundImageStyle(): CSSProperties {
  const safe = loginBackgroundImageUrl.replace(/'/g, '%27');
  return { backgroundImage: `url('${safe}')` };
}
