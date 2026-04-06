'use client';

import type { LucideIcon } from 'lucide-react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';
import { PlayerRosterTableRow } from './PlayerRosterTableRow';

export type RoleCategoryRow = {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  participants: EventParticipant[];
};

type RoleRosterGridProps = {
  tEv: (key: string) => string;
  isAdmin: boolean;
  participantsCount: number;
  roleCategories: RoleCategoryRow[];
  classColors: Record<string, string>;
  viewerSid: string | null;
  onEditParticipant: (p: EventParticipant) => void;
  onDeleteParticipant: (id: string) => void;
};

export function RoleRosterGrid({
  tEv,
  isAdmin,
  participantsCount,
  roleCategories,
  classColors,
  viewerSid,
  onEditParticipant,
  onDeleteParticipant,
}: RoleRosterGridProps) {
  const categories = isAdmin
    ? roleCategories
    : roleCategories.filter((c) => c.participants.length > 0);

  return (
    <div className="space-y-4">
      {!isAdmin && participantsCount > 0 ? (
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <Users className="h-5 w-5 text-purple-400" />
          {tEv('rosterSectionTitle')}
          <span className="text-muted-foreground">({participantsCount})</span>
        </h2>
      ) : null}
      <div
        className={cn(
          'grid',
          !isAdmin && participantsCount > 0 ? 'gap-4' : 'gap-6',
        )}
      >
        {categories.map(
          ({
            key,
            label,
            icon: Icon,
            color,
            participants: roleParticipants,
          }) => (
            <div
              key={key}
              className="overflow-hidden rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-3">
                <Icon className={cn('h-5 w-5', color)} />
                {!isAdmin ? (
                  <h3 className="font-semibold text-foreground">{label}</h3>
                ) : (
                  <h2 className="font-semibold text-foreground">{label}</h2>
                )}
                <span className="text-sm text-muted-foreground">
                  ({roleParticipants.length})
                </span>
              </div>

              {roleParticipants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-border/50 text-sm text-muted-foreground">
                        <th className="w-[22%] px-4 py-2 text-left font-medium">
                          {tEv('columns.name')}
                        </th>
                        <th className="w-[18%] px-4 py-2 text-left font-medium">
                          {tEv('columns.class')}
                        </th>
                        <th className="w-[18%] px-4 py-2 text-left font-medium">
                          {tEv('columns.spec')}
                        </th>
                        <th className="w-[12%] px-4 py-2 text-center font-medium">
                          {tEv('columns.ilvl')}
                        </th>
                        <th className="w-[12%] px-4 py-2 text-center font-medium">
                          {tEv('keyRange')}
                        </th>
                        <th className="w-[9%] px-4 py-2 text-center font-medium">
                          <BloodlustIcon className="inline h-5 w-5 text-orange-400" />
                        </th>
                        <th className="w-[9%] px-4 py-2 text-center font-medium">
                          <BattleRezIcon className="inline h-5 w-5 text-green-400" />
                        </th>
                        {isAdmin ? <th className="w-[8%]" /> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {isAdmin
                        ? roleParticipants.map((participant) => (
                            <PlayerRosterTableRow
                              key={participant.id}
                              participant={participant}
                              isViewer={false}
                              classColors={classColors}
                              tEv={tEv}
                              admin={{
                                onRowClick: () =>
                                  onEditParticipant(participant),
                                onDelete: () =>
                                  void onDeleteParticipant(participant.id),
                                deleteTitle: tEv('deleteParticipant'),
                              }}
                            />
                          ))
                        : roleParticipants.map((participant) => (
                            <PlayerRosterTableRow
                              key={participant.id}
                              participant={participant}
                              isViewer={participant.id === viewerSid}
                              classColors={classColors}
                              tEv={tEv}
                            />
                          ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  {tEv('noParticipants')}
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
