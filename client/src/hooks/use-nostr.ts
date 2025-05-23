import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NostrWebSocket, type WebSocketMessage } from '@/lib/websocket';
import { type NostrNote, type RelayStatus } from '@shared/schema';

export interface NostrStats {
  totalNotes: number;
  avgPow: number;
  highPowNotes: number;
}

export function useNostr() {
  const [isConnected, setIsConnected] = useState(false);
  const [relayStatuses, setRelayStatuses] = useState<RelayStatus[]>([]);
  const [realtimeNotes, setRealtimeNotes] = useState<NostrNote[]>([]);
  const wsRef = useRef<NostrWebSocket | null>(null);
  const queryClient = useQueryClient();

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_note':
        setRealtimeNotes(prev => [message.data, ...prev.slice(0, 99)]); // Keep last 100 notes
        // Invalidate notes query to refresh the feed
        queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
        break;
      case 'relay_status':
        setRelayStatuses(message.data || []);
        break;
      case 'notes_response':
        // Handle bulk notes response if needed
        break;
      case 'error':
        console.error('WebSocket error:', message.error);
        break;
    }
  }, [queryClient]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  useEffect(() => {
    wsRef.current = new NostrWebSocket(handleWebSocketMessage, handleConnectionChange);
    wsRef.current.connect();

    return () => {
      wsRef.current?.disconnect();
    };
  }, [handleWebSocketMessage, handleConnectionChange]);

  const addRelay = useCallback((url: string) => {
    wsRef.current?.addRelay(url);
  }, []);

  const removeRelay = useCallback((url: string) => {
    wsRef.current?.removeRelay(url);
  }, []);

  return {
    isConnected,
    relayStatuses,
    realtimeNotes,
    addRelay,
    removeRelay,
  };
}

export function useNotes(options: {
  limit?: number;
  offset?: number;
  minPowDifficulty?: number;
  sortBy?: string;
} = {}) {
  const { limit = 50, offset = 0, minPowDifficulty = 0, sortBy = 'pow_desc' } = options;
  
  return useQuery({
    queryKey: ['/api/notes', { limit, offset, minPowDifficulty, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        minPowDifficulty: minPowDifficulty.toString(),
        sortBy,
      });
      
      const response = await fetch(`/api/notes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      return response.json() as Promise<NostrNote[]>;
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useRelays() {
  return useQuery({
    queryKey: ['/api/relays'],
    queryFn: async () => {
      const response = await fetch('/api/relays');
      if (!response.ok) {
        throw new Error('Failed to fetch relays');
      }
      return response.json();
    },
    staleTime: 60000, // Consider data stale after 1 minute
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json() as Promise<NostrStats>;
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
