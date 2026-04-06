'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ITEM_LEVEL_MAX, ITEM_LEVEL_MIN } from '@/constants/itemLevels';
import {
  KEYSTONE_MAX_LEVEL,
  KEYSTONE_MIN_LEVEL,
} from '@/constants/keystoneLevels';
import { cn } from '@/lib/utils';
import { riftVoidSolid } from '@/lib/riftUi';
import { WOW_CLASSES_EDIT_PARTICIPANT } from '@/lib/wowEditParticipantCatalog';
import { Trash2 } from 'lucide-react';

import { BloodlustIcon, BattleRezIcon } from '../wow-icons';
import type { EventParticipant } from '../eventPartyModel';

import type { EditParticipantFormState } from './useEditParticipantForm';

const optionClass = cn(riftVoidSolid, 'text-neutral-100');
const selectClass =
  'h-9 w-full rounded-md border border-purple-500/30 bg-input px-3 text-sm text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 disabled:opacity-50 [color-scheme:dark]';
const inputClass = 'border-purple-500/30 bg-purple-900/20 text-foreground';

export type EditParticipantDialogBodyProps = {
  form: EditParticipantFormState;
  participant: EventParticipant | null;
  tEv: (key: string) => string;
  formatRole: (role: EventParticipant['role']) => string;
  onClose: () => void;
};

export function EditParticipantDialogBody({
  form,
  participant,
  tEv,
  formatRole,
  onClose,
}: EditParticipantDialogBodyProps) {
  const {
    name,
    setName,
    wowClass,
    onClassChange,
    spec,
    setSpec,
    ilvl,
    setIlvl,
    keyMin,
    keyMax,
    onKeyMinChange,
    onKeyMaxChange,
    role,
    hasBloodlust,
    hasBattleRez,
    availableSpecs,
    handleSave,
    handleDelete,
    canSave,
    mode,
  } = form;

  return (
    <div
      className={cn(
        'relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-purple-500/30 p-6 text-foreground shadow-xl [color-scheme:dark]',
        riftVoidSolid,
      )}
    >
      <h2 className="text-xl font-bold text-foreground">
        {mode === 'add' ? tEv('addParticipantTitle') : tEv('editParticipant')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === 'add'
          ? wowClass && spec
            ? `${wowClass} - ${spec}`
            : '—'
          : `${participant?.name} - ${participant?.class}`}
      </p>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label
            htmlFor="participant-name"
            className="text-sm text-muted-foreground"
          >
            {tEv('editName')}
          </label>
          <Input
            id="participant-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="participant-class"
            className="text-sm text-muted-foreground"
          >
            {tEv('editClass')}
          </label>
          <select
            id="participant-class"
            value={wowClass}
            onChange={(e) => onClassChange(e.target.value)}
            className={selectClass}
          >
            <option value="" className={optionClass}>
              —
            </option>
            {WOW_CLASSES_EDIT_PARTICIPANT.map((c) => (
              <option key={c} value={c} className={optionClass}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="participant-spec"
            className="text-sm text-muted-foreground"
          >
            {tEv('editSpec')}
          </label>
          <select
            id="participant-spec"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            disabled={!wowClass}
            className={selectClass}
          >
            <option value="" className={optionClass}>
              —
            </option>
            {availableSpecs.map((s) => (
              <option key={s} value={s} className={optionClass}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">
            {tEv('editRole')}
          </span>
          <div className="rounded-md border border-purple-500/20 bg-purple-900/10 px-3 py-2 text-foreground/70">
            {spec ? formatRole(role) : '—'}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="participant-ilvl"
            className="text-sm text-muted-foreground"
          >
            {tEv('editIlvl')}
          </label>
          <Input
            id="participant-ilvl"
            type="number"
            value={ilvl}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setIlvl(Number.isFinite(n) ? n : ITEM_LEVEL_MIN);
            }}
            className={inputClass}
            min={ITEM_LEVEL_MIN}
            max={ITEM_LEVEL_MAX}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="key-min" className="text-sm text-muted-foreground">
              {tEv('editKeyMin')}
            </label>
            <Input
              id="key-min"
              type="number"
              value={keyMin}
              onChange={(e) => onKeyMinChange(e.target.value)}
              className={inputClass}
              min={KEYSTONE_MIN_LEVEL}
              max={KEYSTONE_MAX_LEVEL}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="key-max" className="text-sm text-muted-foreground">
              {tEv('editKeyMax')}
            </label>
            <Input
              id="key-max"
              type="number"
              value={keyMax}
              onChange={(e) => onKeyMaxChange(e.target.value)}
              className={inputClass}
              min={KEYSTONE_MIN_LEVEL}
              max={KEYSTONE_MAX_LEVEL}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 border-t border-purple-500/20 pt-2">
          <div
            className={`flex items-center gap-2 ${hasBloodlust ? 'opacity-100' : 'opacity-30'}`}
          >
            <BloodlustIcon className="h-5 w-5 text-orange-400" />
            <span className="text-sm text-muted-foreground">
              {tEv('editHasBloodlust')}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 ${hasBattleRez ? 'opacity-100' : 'opacity-30'}`}
          >
            <BattleRezIcon className="h-5 w-5 text-green-400" />
            <span className="text-sm text-muted-foreground">
              {tEv('editHasBattleRez')}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center border-t border-purple-500/20 pt-4 ${mode === 'add' ? 'justify-end' : 'justify-between'}`}
      >
        {mode === 'edit' ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleDelete()}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tEv('deleteParticipant')}
          </Button>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-purple-500/30 text-muted-foreground hover:bg-purple-500/10"
          >
            {tEv('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
          >
            {mode === 'add' ? tEv('add') : tEv('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
