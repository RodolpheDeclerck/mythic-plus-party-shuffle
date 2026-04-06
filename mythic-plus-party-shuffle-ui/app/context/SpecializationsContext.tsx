'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import axios from 'axios';
import apiUrl from '@/config/apiConfig';

interface SpecializationsContextProps {
  specializations: string[];
  fetchSpecializations: (selectedClass: string) => void;
}

const SpecializationsContext = createContext<
  SpecializationsContextProps | undefined
>(undefined);

export const SpecializationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [specializations, setSpecializations] = useState<string[]>([]);

  const fetchSpecializations = useCallback(async (selectedClass: string) => {
    try {
      const storedSpecializations = localStorage.getItem(
        `specializations_${selectedClass}`,
      );
      if (storedSpecializations) {
        setSpecializations(JSON.parse(storedSpecializations));
      } else {
        const response = await axios.get<string[]>(
          `${apiUrl}/api/specializations/${selectedClass}`,
        );
        setSpecializations(response.data);
        localStorage.setItem(
          `specializations_${selectedClass}`,
          JSON.stringify(response.data),
        );
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  }, []);

  return (
    <SpecializationsContext.Provider
      value={{ specializations, fetchSpecializations }}
    >
      {children}
    </SpecializationsContext.Provider>
  );
};

export const useSpecializations = () => {
  const context = useContext(SpecializationsContext);
  if (!context) {
    throw new Error(
      'useSpecializations must be used within a SpecializationsProvider',
    );
  }
  return context;
};
