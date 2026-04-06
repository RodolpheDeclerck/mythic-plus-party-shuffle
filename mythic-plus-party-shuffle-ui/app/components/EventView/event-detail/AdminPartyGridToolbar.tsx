'use client';

import { Eye, EyeOff, Plus, Shuffle, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AdminPartyGridToolbarProps = {
  tEv: (key: string) => string;
  arePartiesVisible: boolean;
  onToggleVisibility: () => void | Promise<void>;
  onClearGroupsOpen: () => void;
  onShuffle: () => void;
  onAddGroup: () => void;
};

export function AdminPartyGridToolbar({
  tEv,
  arePartiesVisible,
  onToggleVisibility,
  onClearGroupsOpen,
  onShuffle,
  onAddGroup,
}: AdminPartyGridToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Users className="h-5 w-5 text-cyan-400" />
        {tEv('generatedGroups')}
      </h2>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => void onToggleVisibility()}
          variant="outline"
          size="sm"
          className={
            arePartiesVisible
              ? 'border-green-500/50 text-green-400 hover:bg-green-500/10'
              : 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10'
          }
        >
          {arePartiesVisible ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              {tEv('groupsVisibleToParticipants')}
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              {tEv('groupsHiddenFromParticipants')}
            </>
          )}
        </Button>
        <Button
          onClick={onClearGroupsOpen}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {tEv('clearGroups')}
        </Button>
        <Button
          onClick={onAddGroup}
          variant="outline"
          size="sm"
          className="border-green-500/50 text-green-400 hover:bg-green-500/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          {tEv('addGroup')}
        </Button>
        <Button
          onClick={onShuffle}
          variant="outline"
          size="sm"
          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
        >
          <Shuffle className="mr-2 h-4 w-4" />
          {tEv('shuffleAgain')}
        </Button>
      </div>
    </div>
  );
}
