import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@entities/notifications/notifications.api';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { API } from '@shared/api/endpoints';
import { toast } from '@app/store/toast.store';

export const notificationKeys = {
  all: ['notifications'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

const WS_BASE_URL = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
const MAX_RECONNECT_ATTEMPTS = 5;
const AUTH_CLOSE_CODES = new Set([1008, 4001, 4401]);

export function useUnreadNotifications() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
  const enabled = Boolean(user && accessToken && !isSessionLoading);
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationsApi.unread,
    enabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchInterval: 60_000,
  });
}

export function useNotificationsRealtime() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const connectDelayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!WS_BASE_URL) return;

    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
    const clearConnectDelayTimer = () => {
      if (connectDelayTimerRef.current !== null) {
        window.clearTimeout(connectDelayTimerRef.current);
        connectDelayTimerRef.current = null;
      }
    };

    const refreshAccessToken = async (): Promise<boolean> => {
      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
      if (!refreshToken) return false;
      try {
        const refreshed = await authApi.refresh(refreshToken);
        if (!refreshed?.accessToken) {
          clearAuth();
          return false;
        }
        setTokens(refreshed.accessToken, refreshed.refreshToken ?? refreshToken);
        return true;
      } catch {
        clearAuth();
        return false;
      }
    };

    const getAccessToken = (): string | null => useAuthStore.getState().accessToken;

    const connect = () => {
      if (disposed) return;
      if (wsRef.current) return;
      if (isConnectingRef.current) return;

      isConnectingRef.current = true;
      console.log('WS CONNECT ATTEMPT');

      clearConnectDelayTimer();
      connectDelayTimerRef.current = window.setTimeout(() => {
        if (disposed) {
          isConnectingRef.current = false;
          return;
        }
        if (wsRef.current) {
          isConnectingRef.current = false;
          return;
        }

        const token = getAccessToken();
        if (!token) {
          isConnectingRef.current = false;
          return;
        }

        const wsUrl = `${WS_BASE_URL}${API.notifications.ws}?token=${encodeURIComponent(token)}`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          isConnectingRef.current = false;
          reconnectAttemptsRef.current = 0;
          console.debug('[notifications-ws] OPEN');
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string; data?: { title?: string; message?: string } };
            if (payload.type && payload.type !== 'connected') {
              queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
              const title = payload.data?.title ?? 'Notification';
              const message = payload.data?.message ?? 'You have a new update.';
              toast.info(title, message);
            }
          } catch {
            // Ignore malformed realtime payloads
          }
        };

        socket.onerror = (event) => {
          console.debug('[notifications-ws] ERROR', event);
        };

        socket.onclose = (event) => {
          console.debug('[notifications-ws] CLOSE', event.code, event.reason);
          wsRef.current = null;
          isConnectingRef.current = false;
          if (disposed) return;

          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            return;
          }

          reconnectAttemptsRef.current += 1;
          const delayMs = 1000 * reconnectAttemptsRef.current;

          clearReconnectTimer();
          reconnectTimerRef.current = window.setTimeout(async () => {
            if (disposed) return;
            if (wsRef.current) return;

            if (AUTH_CLOSE_CODES.has(event.code)) {
              const refreshed = await refreshAccessToken();
              if (!refreshed) return;
            }

            connect();
          }, delayMs);
        };
      }, 50);
    };

    connect();

    return () => {
      disposed = true;
      clearReconnectTimer();
      clearConnectDelayTimer();
      reconnectAttemptsRef.current = 0;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [queryClient]);
}
