'use client';

import React from 'react';
import Link from 'next/link';

import { Input } from '@/components/ui/input';

import { EventRegisterFields } from './EventRegisterFields';
import { EventRegisterFormActions } from './EventRegisterFormActions';
import { EventRegisterRolePreview } from './EventRegisterRolePreview';
import type { EventRegisterFormProps } from './eventRegisterFormProps';
import { eventRegisterInputClass } from './eventRegisterFormStyles';
import { useEventRegisterForm } from './useEventRegisterForm';

export type { EventRegisterFormProps } from './eventRegisterFormProps';

const EventRegisterForm: React.FC<EventRegisterFormProps> = (props) => {
  const {
    variant = 'page',
    onCancel,
    hideSignInLink = false,
  } = props;

  const {
    eventCode,
    t,
    fid,
    classes,
    specializations,
    name,
    selectCharacterClass,
    selectSpecialization,
    iLevel,
    kStoneMin,
    kStoneMax,
    isSaving,
    saveError,
    previewRole,
    hasBloodlust,
    hasBattleRez,
    canSubmit,
    handleNameChange,
    handleClassChange,
    handleSpecializationChange,
    handleILevelChange,
    handleILevelBlur,
    handleILevelFocus,
    handleKeystoneMinChange,
    handleKeystoneMaxChange,
    handleKeystoneMinBlur,
    handleKeystoneMaxBlur,
    handleKeystoneMinFocus,
    handleKeystoneMaxFocus,
    handleSave,
    nameMaxLength,
  } = useEventRegisterForm(props);

  if (!eventCode) {
    if (variant === 'embedded') return null;
    return (
      <div className="flex flex-col gap-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          {t('eventRegister.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) void handleSave();
      }}
    >
      {saveError ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {saveError}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={fid('name')} className="text-sm text-muted-foreground">
          {t('eventRegister.nameLabel')}
        </label>
        <Input
          id={fid('name')}
          value={name}
          onChange={handleNameChange}
          placeholder={t('eventRegister.namePlaceholder')}
          maxLength={nameMaxLength}
          disabled={isSaving}
          className={eventRegisterInputClass}
        />
      </div>

      <EventRegisterFields
        fid={fid}
        isSaving={isSaving}
        wowClasses={classes}
        specializations={specializations}
        selectCharacterClass={selectCharacterClass}
        selectSpecialization={selectSpecialization}
        onClassChange={handleClassChange}
        onSpecChange={handleSpecializationChange}
        iLevel={iLevel}
        kStoneMin={kStoneMin}
        kStoneMax={kStoneMax}
        onILevelChange={handleILevelChange}
        onILevelBlur={handleILevelBlur}
        onILevelFocus={handleILevelFocus}
        onKeystoneMinChange={handleKeystoneMinChange}
        onKeystoneMaxChange={handleKeystoneMaxChange}
        onKeystoneMinBlur={handleKeystoneMinBlur}
        onKeystoneMaxBlur={handleKeystoneMaxBlur}
        onKeystoneMinFocus={handleKeystoneMinFocus}
        onKeystoneMaxFocus={handleKeystoneMaxFocus}
      />

      {selectCharacterClass && selectSpecialization ? (
        <EventRegisterRolePreview
          previewRole={previewRole}
          hasBloodlust={hasBloodlust}
          hasBattleRez={hasBattleRez}
        />
      ) : null}

      <EventRegisterFormActions
        isSaving={isSaving}
        canSubmit={canSubmit}
        onCancel={onCancel}
        hideSignInLink={hideSignInLink}
      />
    </form>
  );
};

export default EventRegisterForm;
