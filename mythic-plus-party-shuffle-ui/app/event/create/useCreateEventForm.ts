'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import apiUrl from '@/config/apiConfig';
import useAuthCheck from '@/hooks/useAuthCheck';

interface EventResponse {
  code: string;
}

export function useCreateEventForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isAuthChecked } = useAuthCheck();
  const [eventName, setEventName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthChecked && isAuthenticated === false) {
      window.location.href = '/login';
    }
  }, [isAuthChecked, isAuthenticated]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const name = eventName.trim();
      if (!name) return;

      setErrorMessage(null);
      setIsCreating(true);

      try {
        const response = await axios.post<EventResponse>(
          `${apiUrl}/api/events`,
          { name },
          { withCredentials: true },
        );

        const code = response.data.code;
        router.push(`/event?code=${encodeURIComponent(code)}`);
      } catch (error) {
        console.error('Error creating event:', error);
        setErrorMessage(t('createEvent.errorGeneric'));
        setIsCreating(false);
      }
    },
    [eventName, router, t],
  );

  const showAuthGate = !isAuthChecked || !isAuthenticated;
  const isFormValid = eventName.trim() !== '';

  return {
    t,
    eventName,
    setEventName,
    isCreating,
    errorMessage,
    handleSubmit,
    isFormValid,
    showAuthGate,
  };
}
