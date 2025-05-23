import { type NostrNote, type RelayStatus } from "@shared/schema";

export interface WebSocketMessage {
  type: 'new_note' | 'relay_status' | 'notes_response' | 'error';
  data?: any;
  error?: string;
}

export class NostrWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  
  constructor(
    private onMessage: (message: WebSocketMessage) => void,
    private onConnectionChange: (connected: boolean) => void
  ) {}

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');
        this.isConnecting = false;
        this.onConnectionChange(true);
        this.clearReconnectTimeout();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
        this.isConnecting = false;
        this.onConnectionChange(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.onConnectionChange(false);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      this.onConnectionChange(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimeout();
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 3000);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  addRelay(url: string): void {
    this.send({
      type: 'add_relay',
      url
    });
  }

  removeRelay(url: string): void {
    this.send({
      type: 'remove_relay',
      url
    });
  }

  requestNotes(options: {
    limit?: number;
    offset?: number;
    minPowDifficulty?: number;
    sortBy?: string;
  } = {}): void {
    this.send({
      type: 'get_notes',
      ...options
    });
  }

  disconnect(): void {
    this.clearReconnectTimeout();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
