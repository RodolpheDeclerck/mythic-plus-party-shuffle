'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  LogOut,
  Pencil,
  Plus,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';

type EventDetailHeaderProps = {
  isAdmin: boolean;
  homeHref: string;
  eventName: string;
  eventCode: string;
  eventCreatedAt?: string;
  participantsCount: number;
  codeCopied: boolean;
  onCopyCode: () => void;
  shufflePending: boolean;
  onAddParticipant: () => void;
  onClearParticipantsOpen: () => void;
  onShuffle: () => void;
  viewerParticipant: EventParticipant | null;
  onEditParticipant: (p: EventParticipant) => void;
  onLeaveOpen: () => void;
  tEv: (key: string) => string;
};

export function EventDetailHeader({
  isAdmin,
  homeHref,
  eventName,
  eventCode,
  eventCreatedAt,
  participantsCount,
  codeCopied,
  onCopyCode,
  shufflePending,
  onAddParticipant,
  onClearParticipantsOpen,
  onShuffle,
  viewerParticipant,
  onEditParticipant,
  onLeaveOpen,
  tEv,
}: EventDetailHeaderProps) {
  if (isAdmin) {
    return (
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <Link
            href={homeHref}
            className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400"
          >
            <ArrowLeft className="h-4 w-4" />
            {tEv('backToDashboard')}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{tEv('eventCode')}:</span>
              <code className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-cyan-400">
                {eventCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopyCode}
                className="h-6 w-6 p-0"
                aria-label={tEv('copyCode')}
              >
                {codeCopied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            {eventCreatedAt ? (
              <span>
                {tEv('createdOn')}: {eventCreatedAt}
              </span>
            ) : null}
            <span>
              {tEv('totalParticipants')}: {participantsCount}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={onAddParticipant}
            className="border border-green-500/50 bg-green-500/20 font-semibold text-green-400 hover:bg-green-500/30"
          >
            <Plus className="mr-2 h-4 w-4" />
            {tEv('addParticipant')}
          </Button>
          <div className="h-6 w-px bg-purple-500/30" />
          <Button
            type="button"
            onClick={onClearParticipantsOpen}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            disabled={participantsCount === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tEv('clearParticipants')}
          </Button>
          <Button
            type="button"
            variant="portal"
            onClick={onShuffle}
            disabled={shufflePending || participantsCount === 0}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            {shufflePending ? tEv('shuffling') : tEv('shuffleParties')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Link
          href={homeHref}
          className="mt-1 text-muted-foreground transition-colors hover:text-cyan-400"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <p className="font-mono text-sm text-muted-foreground">{eventCode}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {tEv('totalParticipants')}: {participantsCount}
          </p>
        </div>
      </div>
      {viewerParticipant ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEditParticipant(viewerParticipant)}
            className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Pencil className="mr-2 h-4 w-4" />
            {tEv('editCharacter')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLeaveOpen}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {tEv('leaveEvent')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
