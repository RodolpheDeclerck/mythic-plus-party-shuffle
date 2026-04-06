import { upsertCharacter, deleteCharacter } from '@/services/api';
import {
  KEYSTONE_MIN_LEVEL,
  KEYSTONE_MAX_LEVEL,
} from '@/constants/keystoneLevels';
import { ITEM_LEVEL_MIN, ITEM_LEVEL_MAX } from '@/constants/itemLevels';

export const useCharacterActions = (
  eventCode: string,
  onSave: (updatedCharacter: any) => void,
  onDelete: (id: number) => void,
  router: any,
) => {
  const handleSave = async (
    formValues: any,
    character: any,
    isAdmin: boolean,
    setIsEditing: (value: boolean) => void,
  ) => {
    const minLevel = Math.max(KEYSTONE_MIN_LEVEL, formValues.keystoneMinLevel);
    const maxLevel = Math.min(
      KEYSTONE_MAX_LEVEL,
      Math.max(minLevel, formValues.keystoneMaxLevel),
    );

    const itemLevel = Math.max(
      ITEM_LEVEL_MIN,
      Math.min(formValues.iLevel, ITEM_LEVEL_MAX),
    );

    const updatedCharacter = {
      ...character,
      name: formValues.name,
      characterClass: formValues.characterClass,
      specialization: formValues.specialization,
      iLevel: itemLevel,
      keystoneMinLevel: minLevel,
      keystoneMaxLevel: maxLevel,
      eventCode: eventCode,
    };

    try {
      const savedCharacter = await upsertCharacter(updatedCharacter);
      if (!isAdmin) {
        onSave(savedCharacter);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to upsert character:', error);
    }
  };

  const handleLeave = async (character: any) => {
    try {
      await deleteCharacter(character?.id || 0);
      onDelete(character?.id || 0);
    } catch (error) {
      console.error('Failed to delete character:', error);
    } finally {
      localStorage.removeItem('createdCharacter');
      router.push('/event/join');
    }
  };

  const handleAdd = (setIsEditing: (value: boolean) => void) => {
    setIsEditing(true);
    onSave({});
  };

  const handleCancel = (setIsEditing: (value: boolean) => void) => {
    setIsEditing(false);
  };

  return {
    handleSave,
    handleLeave,
    handleAdd,
    handleCancel,
  };
};
