/**
 * Tailwind class strings using `var(--rift-void)` instead of scattered `#0a0614` hex values.
 * Safe to import from any module (no `'use client'` required).
 */

export const riftVoidFill95 =
  'bg-[color-mix(in_srgb,var(--rift-void)_95%,transparent)]';

export const riftVoidFill80 =
  'bg-[color-mix(in_srgb,var(--rift-void)_80%,transparent)]';

export const riftVoidFill60 =
  'bg-[color-mix(in_srgb,var(--rift-void)_60%,transparent)]';

export const riftVoidFill50 =
  'bg-[color-mix(in_srgb,var(--rift-void)_50%,transparent)]';

export const riftVoidSolid = 'bg-[var(--rift-void)]';

/** Cyan/violet gradient border (auth cards / modals). */
export const riftAuthGradientBorder =
  'rounded-2xl bg-gradient-to-br from-cyan-500/70 via-purple-600/50 to-violet-800/60 p-px shadow-2xl shadow-cyan-500/20';

/** Focus ring offset aligned with the portal background. */
export const riftFocusRingOffsetVoid =
  'focus-visible:ring-offset-[var(--rift-void)]';
