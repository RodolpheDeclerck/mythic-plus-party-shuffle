'use client';

import { Shuffle, Shield, Heart, Sword, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';
import {
  getPartyGroupAggregateStats,
  getPartyGroupCompositionStatus,
  partyGroupContainsCharacterId,
} from './partyGroupUtils';
import { PlayerRosterTableRow } from './PlayerRosterTableRow';

type TEv = (key: string) => string;

export function PlayerHiddenGroupsBanner({
  tEv,
  isAdmin,
  shuffledGroups,
  arePartiesVisible,
}: {
  tEv: TEv;
  isAdmin: boolean;
  shuffledGroups: EventPartyGroup[];
  arePartiesVisible: boolean;
}) {
  if (isAdmin || shuffledGroups.length === 0 || arePartiesVisible) return null;
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <Shuffle className="h-5 w-5 text-cyan-400" />
        {tEv('generatedGroups')}
      </h2>
      <div className="rounded-xl border border-purple-500/20 bg-purple-900/10 py-10 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">{tEv('groupsHiddenByAdmin')}</p>
      </div>
    </div>
  );
}

export function PlayerVisiblePartySections({
  tEv,
  isAdmin,
  shuffledGroups,
  groupsToRender,
  arePartiesVisible,
  viewerCharacterId,
  viewerSid,
  classColors,
}: {
  tEv: TEv;
  isAdmin: boolean;
  shuffledGroups: EventPartyGroup[];
  groupsToRender: EventPartyGroup[];
  arePartiesVisible: boolean;
  viewerCharacterId: number | null;
  viewerSid: string | null;
  classColors: Record<string, string>;
}) {
  return (
    <>
      {!isAdmin && shuffledGroups.length > 0 && arePartiesVisible ? (
        <div className="w-full space-y-4">
          {groupsToRender.length > 0 ? (
            <>
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <Shuffle className="h-5 w-5 text-cyan-400" />
                {tEv('yourGroup')}
              </h2>
              <div className="grid gap-4">
                {groupsToRender.map((group) => {
                  const groupNumberRaw = shuffledGroups.findIndex(
                    (x) => x.id === group.id,
                  );
                  const groupNumber =
                    groupNumberRaw >= 0 ? groupNumberRaw + 1 : 1;
                  const highlighted =
                    viewerCharacterId != null &&
                    partyGroupContainsCharacterId(group, viewerCharacterId);
                  const stats = getPartyGroupAggregateStats(group);
                  const comp = getPartyGroupCompositionStatus(group);
                  const members = [
                    group.tank,
                    group.healer,
                    ...group.dps,
                  ].filter((m): m is EventParticipant => m != null);

                  return (
                    <div
                      key={group.id}
                      className={cn(
                        'overflow-hidden rounded-xl border',
                        highlighted
                          ? 'border-cyan-400/40'
                          : 'border-purple-500/20',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-3 px-4 py-2',
                          highlighted ? 'bg-cyan-900/20' : 'bg-purple-900/20',
                        )}
                      >
                        <span className="font-semibold text-foreground">
                          {tEv('group')} {groupNumber}
                        </span>
                        {members.length > 0 && stats ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono font-bold text-blue-300">
                              {stats.minIlvl}-{stats.maxIlvl}
                            </span>
                            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-purple-300">
                              ~{stats.avgIlvlRounded}
                            </span>
                            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-cyan-300">
                              +{stats.minKey}-{stats.maxKey}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {comp.hasMissing ? (
                        <div className="flex flex-wrap items-center gap-2 border-b border-amber-500/20 bg-amber-900/20 px-4 py-2 text-xs">
                          <span className="font-medium text-amber-400">
                            {tEv('missing')}
                          </span>
                          {comp.missingTank ? (
                            <span className="flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-blue-300">
                              <Shield className="h-3 w-3" /> Tank
                            </span>
                          ) : null}
                          {comp.missingHealer ? (
                            <span className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-green-300">
                              <Heart className="h-3 w-3" /> Healer
                            </span>
                          ) : null}
                          {comp.missingDps > 0 ? (
                            <span className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-red-300">
                              <Sword className="h-3 w-3" /> {comp.missingDps}{' '}
                              DPS
                            </span>
                          ) : null}
                          {!comp.hasBloodlust ? (
                            <span className="flex items-center gap-1 rounded bg-orange-500/20 px-2 py-0.5 text-orange-300">
                              <BloodlustIcon className="h-3 w-3" /> BL
                            </span>
                          ) : null}
                          {!comp.hasBattleRez ? (
                            <span className="flex items-center gap-1 rounded bg-teal-500/20 px-2 py-0.5 text-teal-300">
                              <BattleRezIcon className="h-3 w-3" /> BR
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 border-b border-green-500/20 bg-green-900/20 px-4 py-2 text-xs">
                          <span className="font-medium text-green-400">
                            {tEv('complete')}
                          </span>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                          <tbody>
                            {group.tank ? (
                              <PlayerRosterTableRow
                                key={`t-${group.tank.id}`}
                                participant={group.tank}
                                isViewer={group.tank.id === viewerSid}
                                classColors={classColors}
                                tEv={tEv}
                                showRole
                              />
                            ) : null}
                            {group.healer ? (
                              <PlayerRosterTableRow
                                key={`h-${group.healer.id}`}
                                participant={group.healer}
                                isViewer={group.healer.id === viewerSid}
                                classColors={classColors}
                                tEv={tEv}
                                showRole
                              />
                            ) : null}
                            {group.dps.map((dps) =>
                              dps ? (
                                <PlayerRosterTableRow
                                  key={dps.id}
                                  participant={dps}
                                  isViewer={dps.id === viewerSid}
                                  classColors={classColors}
                                  tEv={tEv}
                                  showRole
                                />
                              ) : null,
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <Shuffle className="h-5 w-5 text-cyan-400" />
                {tEv('generatedGroups')}
              </h2>
              <div className="rounded-xl border border-purple-500/20 bg-purple-900/10 py-10 text-center">
                <Shuffle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  {viewerCharacterId == null
                    ? tEv('needCharacterToViewGroup')
                    : tEv('notAssignedToGroup')}
                </p>
              </div>
            </>
          )}
        </div>
      ) : null}

      {!isAdmin && shuffledGroups.length === 0 ? (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Shuffle className="h-5 w-5 text-cyan-400" />
            {tEv('generatedGroups')}
          </h2>
          <div className="rounded-xl border border-purple-500/20 bg-purple-900/10 py-10 text-center">
            <Shuffle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">{tEv('noGroupsYetPlayer')}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
