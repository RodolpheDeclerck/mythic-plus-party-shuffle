import {
  KEYSTONE_MIN_LEVEL,
  KEYSTONE_MAX_LEVEL,
} from '@/constants/keystoneLevels';
import { ITEM_LEVEL_MIN, ITEM_LEVEL_MAX } from '@/constants/itemLevels';

export function normalizeIlvlOnBlur(inputValue: string): string {
  if (inputValue === '') {
    return ITEM_LEVEL_MIN.toString();
  }

  const numValue = parseInt(inputValue, 10);
  if (!Number.isNaN(numValue)) {
    const value = Math.max(
      ITEM_LEVEL_MIN,
      Math.min(numValue, ITEM_LEVEL_MAX),
    );
    return value.toString();
  }

  return ITEM_LEVEL_MIN.toString();
}

export function normalizeKeystoneMinOnBlur(
  inputValue: string,
  kStoneMax: string,
): string {
  if (inputValue === '') {
    return KEYSTONE_MIN_LEVEL.toString();
  }

  const numValue = parseInt(inputValue, 10);
  if (!Number.isNaN(numValue)) {
    const max = parseInt(kStoneMax, 10) || KEYSTONE_MAX_LEVEL;
    const value = Math.max(KEYSTONE_MIN_LEVEL, Math.min(numValue, max));
    return value.toString();
  }

  return KEYSTONE_MIN_LEVEL.toString();
}

export function normalizeKeystoneMaxOnBlur(
  inputValue: string,
  kStoneMin: string,
): string {
  if (inputValue === '') {
    return KEYSTONE_MAX_LEVEL.toString();
  }

  const numValue = parseInt(inputValue, 10);
  if (!Number.isNaN(numValue)) {
    const min = parseInt(kStoneMin, 10) || KEYSTONE_MIN_LEVEL;
    const value = Math.max(min, Math.min(numValue, KEYSTONE_MAX_LEVEL));
    return value.toString();
  }

  return KEYSTONE_MAX_LEVEL.toString();
}
