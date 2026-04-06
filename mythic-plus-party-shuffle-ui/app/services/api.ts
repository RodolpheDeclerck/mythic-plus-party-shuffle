import axios from 'axios';
import apiUrl from '@/config/apiConfig';
import { Character } from '@/types/Character';
import { Party } from '@/types/Party';

export const fetchCharacters = async (
  eventCode: string,
): Promise<Character[]> => {
  const response = await axios.get<Character[]>(
    `${apiUrl}/api/events/${eventCode}/characters`,
  );
  return response.data;
};

export const updateCharacter = async (
  character: Character,
): Promise<Character> => {
  const response = await axios.put<Character>(
    `${apiUrl}/api/characters/${character.id}`,
    character,
  );
  return response.data;
};

export const upsertCharacter = async (
  character: Character,
): Promise<Character> => {
  const response = await axios.put<Character>(
    `${apiUrl}/api/characters/upsert`,
    character,
  );
  return response.data;
};

export const deleteCharacter = async (id: number): Promise<void> => {
  await axios.delete(`${apiUrl}/api/characters/${id}`);
};

export const deleteCharacters = async (ids: number[]): Promise<void> => {
  await axios.post(`${apiUrl}/api/characters/remove`, { ids: ids });
};

export const fetchParties = async (eventCode: string): Promise<Party[]> => {
  const response = await axios.get<Party[]>(
    `${apiUrl}/api/events/${eventCode}/parties`,
  );
  return response.data;
};

export const shuffleParties = async (eventCode: string): Promise<Party[]> => {
  const response = await axios.get<Party[]>(
    `${apiUrl}/api/events/${eventCode}/shuffle-parties`,
  );
  return response.data;
};

export const deleteParties = async (eventCode: string): Promise<void> => {
  await axios.delete(`${apiUrl}/api/events/${eventCode}/parties`);
};

export const saveEventParties = async (
  eventCode: string,
  parties: Party[],
): Promise<void> => {
  await axios.post(`${apiUrl}/api/events/${eventCode}/parties`, parties, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const setEventPartiesVisibility = async (
  eventCode: string,
  visible: boolean,
): Promise<void> => {
  await axios.patch(
    `${apiUrl}/api/events/${eventCode}/setPartiesVisibility`,
    { visible },
    { withCredentials: true },
  );
};
