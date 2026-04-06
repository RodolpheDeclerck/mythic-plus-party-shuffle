'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { wowClassTextColors } from '@/components/EventView/eventClassColors';
import { cn } from '@/lib/utils';
import {
  KEYSTONE_MIN_LEVEL,
  KEYSTONE_MAX_LEVEL,
} from '@/constants/keystoneLevels';
import { ITEM_LEVEL_MIN, ITEM_LEVEL_MAX } from '@/constants/itemLevels';

import {
  eventRegisterInputClass,
  eventRegisterSelectClass,
} from './eventRegisterFormStyles';

export type EventRegisterFieldsProps = {
  fid: (suffix: string) => string;
  isSaving: boolean;
  wowClasses: string[];
  specializations: string[];
  selectCharacterClass: string;
  selectSpecialization: string;
  onClassChange: (value: string) => void;
  onSpecChange: (value: string) => void;
  iLevel: string;
  kStoneMin: string;
  kStoneMax: string;
  onILevelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onILevelBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onILevelFocus: () => void;
  onKeystoneMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeystoneMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeystoneMinBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeystoneMaxBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeystoneMinFocus: () => void;
  onKeystoneMaxFocus: () => void;
};

export function EventRegisterFields({
  fid,
  isSaving,
  wowClasses,
  specializations,
  selectCharacterClass,
  selectSpecialization,
  onClassChange,
  onSpecChange,
  iLevel,
  kStoneMin,
  kStoneMax,
  onILevelChange,
  onILevelBlur,
  onILevelFocus,
  onKeystoneMinChange,
  onKeystoneMaxChange,
  onKeystoneMinBlur,
  onKeystoneMaxBlur,
  onKeystoneMinFocus,
  onKeystoneMaxFocus,
}: EventRegisterFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor={fid('class')}
            className="text-sm text-muted-foreground"
          >
            {t('eventRegister.classLabel')}
          </label>
          <select
            id={fid('class')}
            value={selectCharacterClass}
            onChange={(e) => onClassChange(e.target.value)}
            disabled={isSaving}
            className={cn(
              eventRegisterSelectClass,
              selectCharacterClass
                ? (wowClassTextColors[selectCharacterClass] ?? 'text-zinc-100')
                : 'text-zinc-100',
            )}
          >
            <option value="" className="text-zinc-400">
              {t('eventRegister.classPlaceholder')}
            </option>
            {wowClasses.map((cls) => (
              <option
                key={cls}
                value={cls}
                className={wowClassTextColors[cls] ?? 'text-zinc-100'}
              >
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor={fid('spec')}
            className="text-sm text-muted-foreground"
          >
            {t('eventRegister.specLabel')}
          </label>
          <select
            id={fid('spec')}
            value={selectCharacterClass ? selectSpecialization : ''}
            onChange={(e) => onSpecChange(e.target.value)}
            disabled={isSaving || !selectCharacterClass}
            className={cn(
              eventRegisterSelectClass,
              !selectCharacterClass && 'cursor-not-allowed',
            )}
          >
            <option value="">
              {selectCharacterClass
                ? t('eventRegister.specPlaceholder')
                : t('eventRegister.specNeedClass')}
            </option>
            {selectCharacterClass
              ? specializations.map((spec) => (
                  <option key={spec} value={spec} className="text-zinc-100">
                    {t(`specializations.${spec}`)}
                  </option>
                ))
              : null}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={fid('ilvl')} className="text-sm text-muted-foreground">
          {t('eventRegister.ilvlLabel')}
        </label>
        <Input
          id={fid('ilvl')}
          type="number"
          value={iLevel}
          onChange={onILevelChange}
          onBlur={onILevelBlur}
          onFocus={onILevelFocus}
          placeholder={t('eventRegister.ilvlPlaceholder')}
          min={ITEM_LEVEL_MIN}
          max={ITEM_LEVEL_MAX}
          disabled={isSaving}
          className={eventRegisterInputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor={fid('key-min')}
            className="text-sm text-muted-foreground"
          >
            {t('eventRegister.keyMinLabel')}
          </label>
          <Input
            id={fid('key-min')}
            type="number"
            value={kStoneMin}
            onChange={onKeystoneMinChange}
            onBlur={onKeystoneMinBlur}
            onFocus={onKeystoneMinFocus}
            min={KEYSTONE_MIN_LEVEL}
            max={parseInt(kStoneMax, 10) || KEYSTONE_MAX_LEVEL}
            placeholder={t('eventRegister.keyMinPlaceholder')}
            disabled={isSaving}
            className={eventRegisterInputClass}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor={fid('key-max')}
            className="text-sm text-muted-foreground"
          >
            {t('eventRegister.keyMaxLabel')}
          </label>
          <Input
            id={fid('key-max')}
            type="number"
            value={kStoneMax}
            onChange={onKeystoneMaxChange}
            onBlur={onKeystoneMaxBlur}
            onFocus={onKeystoneMaxFocus}
            min={parseInt(kStoneMin, 10) || KEYSTONE_MIN_LEVEL}
            max={KEYSTONE_MAX_LEVEL}
            placeholder={t('eventRegister.keyMaxPlaceholder')}
            disabled={isSaving}
            className={eventRegisterInputClass}
          />
        </div>
      </div>
    </>
  );
}
