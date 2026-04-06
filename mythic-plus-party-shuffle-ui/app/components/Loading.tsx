import React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { riftVoidFill95 } from '@/lib/riftUi';

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative rounded-2xl bg-gradient-to-br from-cyan-500/50 via-purple-600/40 to-violet-800/50 p-px shadow-lg shadow-cyan-500/15">
        <div
          className={cn(
            'flex min-w-[200px] items-center justify-center rounded-2xl px-8 py-10 backdrop-blur-md',
            riftVoidFill95,
          )}
        >
          <Spinner className="h-8 w-8 text-cyan-400" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
};

export default Loading;
