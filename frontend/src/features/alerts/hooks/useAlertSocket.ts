import { useEffect, useRef } from 'react';
import type { Alert } from '../../../api';
import { alertSocketUrl } from '../api';

const MAX_BACKOFF_MS = 30_000;

/** Keeps a WebSocket to the backend open while the app is open; reconnects with backoff (KAN-66). */
export function useAlertSocket(onAlert: (alert: Alert) => void, onReconnect: () => void): void {
  const handlers = useRef({ onAlert, onReconnect });
  useEffect(() => {
    handlers.current = { onAlert, onReconnect };
  });

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let delay = 1000;
    let closed = false;
    let connectedBefore = false;

    const connect = () => {
      socket = new WebSocket(alertSocketUrl());
      socket.onopen = () => {
        delay = 1000;
        if (connectedBefore) handlers.current.onReconnect(); // catch up on alerts missed while offline
        connectedBefore = true;
      };
      socket.onmessage = (e: MessageEvent<string>) => {
        try {
          handlers.current.onAlert(JSON.parse(e.data) as Alert); // shortcut: trusts the backend message shape
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        if (closed) return;
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, MAX_BACKOFF_MS);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      socket?.close();
    };
  }, []);
}
