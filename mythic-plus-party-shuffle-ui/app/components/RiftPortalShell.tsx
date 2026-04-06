'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { loginBackgroundImageStyle } from '@/config/loginBackground';
import {
  riftAuthGradientBorder,
  riftVoidFill95,
} from '@/lib/riftUi';

export {
  riftAuthGradientBorder,
  riftFocusRingOffsetVoid,
  riftVoidFill50,
  riftVoidFill60,
  riftVoidFill80,
  riftVoidFill95,
  riftVoidSolid,
} from '@/lib/riftUi';

const gradientTop: CSSProperties = {
  backgroundImage:
    'linear-gradient(to top, color-mix(in srgb, var(--rift-void) 100%, transparent), transparent, color-mix(in srgb, var(--rift-void) 40%, transparent))',
};

const gradientSides: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, color-mix(in srgb, var(--rift-void) 50%, transparent), transparent, color-mix(in srgb, var(--rift-void) 50%, transparent))',
};

function scrimStyle(opacity: 60 | 70 | 75): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, var(--rift-void) ${opacity}%, transparent)`,
  };
}

export type RiftPortalBackgroundProps = {
  position?: 'fixed' | 'absolute';
  scrimOpacity?: 60 | 70 | 75;
  /** Include left/right fade (turn off only for rare layout needs). */
  includeSideGradient?: boolean;
};

/** Background image, scrim, and edge fades (same treatment as the event page). */
export function RiftPortalBackground({
  position = 'fixed',
  scrimOpacity = 60,
  includeSideGradient = true,
}: RiftPortalBackgroundProps) {
  const pos = position === 'fixed' ? 'fixed' : 'absolute';
  return (
    <>
      <div
        className={cn(pos, 'inset-0 z-0 bg-cover bg-center bg-no-repeat')}
        style={loginBackgroundImageStyle()}
        aria-hidden
      />
      <div
        className={cn(pos, 'inset-0 z-0')}
        style={scrimStyle(scrimOpacity)}
        aria-hidden
      />
      <div className={cn(pos, 'inset-0 z-0')} style={gradientTop} aria-hidden />
      {includeSideGradient ? (
        <div
          className={cn(pos, 'inset-0 z-0')}
          style={gradientSides}
          aria-hidden
        />
      ) : null}
    </>
  );
}

export type RiftPortalMainProps = {
  children: ReactNode;
  className?: string;
  scrimOpacity?: 60 | 70 | 75;
  backgroundPosition?: 'fixed' | 'absolute';
  includeSideGradient?: boolean;
};

/** `<main>` with portal background; children should set their own `z-10` when needed. */
export function RiftPortalMain({
  children,
  className,
  scrimOpacity = 60,
  backgroundPosition = 'fixed',
  includeSideGradient = true,
}: RiftPortalMainProps) {
  return (
    <main
      className={cn(
        'relative min-h-screen overflow-hidden px-4 py-8',
        className,
      )}
    >
      <RiftPortalBackground
        position={backgroundPosition}
        scrimOpacity={scrimOpacity}
        includeSideGradient={includeSideGradient}
      />
      {children}
    </main>
  );
}

export type RiftAuthCardFrameProps = {
  children: ReactNode;
  className?: string;
  maxWidthClassName?: string;
  innerClassName?: string;
  /** `compact`: `p-8` only (e.g. event registration). */
  paddingVariant?: 'default' | 'compact';
};

/** Gradient border card with inner panel (login, home, register, etc.). */
export function RiftAuthCardFrame({
  children,
  className,
  maxWidthClassName = 'max-w-md',
  innerClassName,
  paddingVariant = 'default',
}: RiftAuthCardFrameProps) {
  return (
    <div className={cn('relative z-10 w-full', maxWidthClassName, className)}>
      <div className={cn('relative', riftAuthGradientBorder)}>
        <div
          className={cn(
            'rounded-2xl backdrop-blur-md',
            riftVoidFill95,
            paddingVariant === 'default' ? 'p-8 sm:p-10' : 'p-8',
            innerClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export type RiftAuthModalFrameProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

/** Centered modal: same border/panel as `RiftAuthCardFrame`, scrollable when content overflows. */
export function RiftAuthModalFrame({
  children,
  className,
  innerClassName,
}: RiftAuthModalFrameProps) {
  return (
    <div
      className={cn(
        'relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto [color-scheme:dark]',
        riftAuthGradientBorder,
        className,
      )}
    >
      <div
        className={cn(
          'rounded-2xl p-6 backdrop-blur-md sm:p-8',
          riftVoidFill95,
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
