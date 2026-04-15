import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export interface IngestionStatus {
  active: boolean;
  progress: number;       // 0–1
  stage: string;          // human-readable stage label
  error: string | null;
}

interface GraphUpdatesReturn {
  connected: boolean;
  ingestion: IngestionStatus;
}

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws/graph`;
}

export function useGraphUpdates(): GraphUpdatesReturn {
  const [connected, setConnected] = useState(false);
  const [ingestion, setIngestion] = useState<IngestionStatus>({
    active: false,
    progress: 0,
    stage: '',
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        const token = useAuthStore.getState().token;
        if (token && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
        setConnected(true);
        console.info('[WS/graph] Connected');
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        // onclose will fire — no special handling
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, data } = msg;

          switch (type) {
            case 'ingestion_progress':
              setIngestion({
                active: true,
                progress: data?.progress ?? 0,
                stage: data?.stage ?? 'processing',
                error: null,
              });
              break;

            case 'ingestion_complete':
              setIngestion({
                active: false,
                progress: 1,
                stage: 'complete',
                error: null,
              });
              break;

            case 'ingestion_error':
              setIngestion((prev) => ({
                ...prev,
                active: false,
                error: data?.error ?? 'Unknown error',
              }));
              break;

            default:
              // node_added, edge_added, etc. — extend as needed
              break;
          }
        } catch {
          console.warn('[WS/graph] Non-JSON message');
        }
      };

      wsRef.current = ws;
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, ingestion };
}
