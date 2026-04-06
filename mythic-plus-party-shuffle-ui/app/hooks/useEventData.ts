import { useState, useCallback, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import apiUrl from '@/config/apiConfig';
import { Event } from '@/types/Event';

export const useEventData = (eventCode: string) => {
  const [arePartiesVisible, setArePartiesVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [eventInfo, setEventInfo] = useState<Event | null>(null);

  useEffect(() => {
    setEventInfo(null);
  }, [eventCode]);

  const checkEventExistence = useCallback(async (): Promise<boolean> => {
    if (eventCode) {
      try {
        const response = await axios.get<Event>(
          `${apiUrl}/api/events?code=${encodeURIComponent(eventCode)}`,
          { withCredentials: true },
        );
        const event = response.data;
        if (event) {
          setEventInfo(event);
          setArePartiesVisible(event.arePartiesVisible);
        }
        return true;
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return false;
        }
        console.error('Error checking event existence:', error);
      }
    }
    return false;
  }, [eventCode]);

  const fetchEvent = useCallback(async () => {
    if (eventCode) {
      try {
        const response = await axios.get<Event>(
          `${apiUrl}/api/events?code=${encodeURIComponent(eventCode)}`,
          { withCredentials: true },
        );
        const event = response.data;
        if (event) {
          setEventInfo(event);
          setArePartiesVisible(event.arePartiesVisible);
        }
      } catch (error: unknown) {
        console.error('Error fetching event:', error);
      }
    }
  }, [eventCode]);

  const togglePartiesVisibility = async () => {
    if (!eventCode) {
      console.error('Event code is missing.');
      return;
    }

    try {
      await axios.patch(
        `${apiUrl}/api/events/${encodeURIComponent(eventCode)}/setPartiesVisibility`,
        { visible: !arePartiesVisible },
        { withCredentials: true },
      );
      setArePartiesVisible((v) => !v);
    } catch (error) {
      console.error('Failed to update parties visibility:', error);
    }
  };

  return {
    arePartiesVisible,
    setArePartiesVisible,
    isVerifying,
    setIsVerifying,
    checkEventExistence,
    fetchEvent,
    togglePartiesVisibility,
    eventInfo,
  };
};
