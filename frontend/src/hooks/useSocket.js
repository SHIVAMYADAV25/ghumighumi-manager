import { useEffect } from 'react';

import useSocketStore
  from '../store/socketStore';

import useAuthStore
  from '../store/authStore';

import useNotificationStore
  from '../store/notificationStore';

export function useSocket() {
  const { accessToken } =
    useAuthStore();

  const {
    connect,
    disconnect,
    socket
  } = useSocketStore();

  const {
    addNotification
  } = useNotificationStore();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    connect(accessToken);

    return () => {
      disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on(
      'notification:new',
      addNotification
    );

    return () => {
      socket.off(
        'notification:new',
        addNotification
      );
    };
  }, [socket]);

  return socket;
}

export function useTripSocket(
  tripId,
  handlers = {}
) {
  const {
    socket,
    joinTrip,
    leaveTrip
  } = useSocketStore();

  useEffect(() => {
    if (!socket || !tripId) {
      return;
    }

    joinTrip(tripId);

    Object.entries(handlers)
      .forEach(([event, handler]) => {
        socket.on(event, handler);
      });

    return () => {
      leaveTrip(tripId);

      Object.entries(handlers)
        .forEach(([event, handler]) => {
          socket.off(event, handler);
        });
    };
  }, [socket, tripId]);
}
