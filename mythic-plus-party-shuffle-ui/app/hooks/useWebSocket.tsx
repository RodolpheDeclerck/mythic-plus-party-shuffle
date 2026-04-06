import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/config/apiConfig';

const useWebSocket = (
  onCharacterUpdated: () => void,
  onPartiesShuffled: () => void,
  onEventsUpdated: () => void = () => {},
): Socket | null => {
  const onCharacterUpdatedRef = useRef(onCharacterUpdated);
  const onPartiesShuffledRef = useRef(onPartiesShuffled);
  const onEventsUpdatedRef = useRef(onEventsUpdated);

  useEffect(() => {
    onCharacterUpdatedRef.current = onCharacterUpdated;
  }, [onCharacterUpdated]);

  useEffect(() => {
    onPartiesShuffledRef.current = onPartiesShuffled;
  }, [onPartiesShuffled]);

  useEffect(() => {
    onEventsUpdatedRef.current = onEventsUpdated;
  }, [onEventsUpdated]);

  useEffect(() => {
    let isMounted = true;
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const handleCharacterUpdated = () => {
      if (isMounted) {
        onCharacterUpdatedRef.current();
      }
    };

    const handlePartiesShuffled = () => {
      if (isMounted) {
        onPartiesShuffledRef.current();
      }
    };

    const handleEventsUpdated = () => {
      if (isMounted) {
        onEventsUpdatedRef.current();
      }
    };

    socket.on('character-updated', handleCharacterUpdated);
    socket.on('parties-updated', handlePartiesShuffled);
    socket.on('event-updated', handleEventsUpdated);

    return () => {
      isMounted = false;
      socket.removeAllListeners();
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  return null;
};

export default useWebSocket;
