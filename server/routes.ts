import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertNostrNoteSchema, insertNostrRelaySchema, type NostrEvent, type RelayMessage, type RelayStatus } from "@shared/schema";
import { z } from "zod";

interface NostrRelay {
  url: string;
  ws: WebSocket | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  subscriptions: Set<string>;
  lastPing: number;
  latency?: number;
}

class NostrRelayManager {
  private relays: Map<string, NostrRelay> = new Map();
  private clients: Set<WebSocket> = new Set();
  private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultRelays();
  }

  private async initializeDefaultRelays() {
    const defaultRelays = [
      "wss://relay.damus.io",
      "wss://nos.lol", 
      "wss://relay.snort.social"
    ];

    for (const url of defaultRelays) {
      await this.addRelay(url);
    }
  }

  async addRelay(url: string): Promise<void> {
    if (this.relays.has(url)) return;

    const relay: NostrRelay = {
      url,
      ws: null,
      status: 'disconnected',
      subscriptions: new Set(),
      lastPing: Date.now()
    };

    this.relays.set(url, relay);
    await storage.createRelay({ url, status: 'disconnected' });
    this.connectToRelay(url);
  }

  private connectToRelay(url: string): void {
    const relay = this.relays.get(url);
    if (!relay || relay.status === 'connecting') return;

    relay.status = 'connecting';
    storage.updateRelayStatus(url, 'connecting');
    this.broadcastRelayStatus();

    try {
      const ws = new WebSocket(url);
      relay.ws = ws;

      const connectTime = Date.now();

      ws.on('open', () => {
        const latency = Date.now() - connectTime;
        relay.status = 'connected';
        relay.latency = latency;
        storage.updateRelayStatus(url, 'connected', latency);
        this.broadcastRelayStatus();

        // Subscribe to recent notes
        this.subscribeToNotes(url);
        console.log(`Connected to relay: ${url} (${latency}ms)`);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleRelayMessage(url, message);
        } catch (error) {
          console.error(`Error parsing message from ${url}:`, error);
        }
      });

      ws.on('close', () => {
        relay.status = 'disconnected';
        relay.ws = null;
        storage.updateRelayStatus(url, 'disconnected');
        this.broadcastRelayStatus();
        console.log(`Disconnected from relay: ${url}`);

        // Schedule reconnection
        this.scheduleReconnection(url);
      });

      ws.on('error', (error) => {
        relay.status = 'error';
        relay.ws = null;
        storage.updateRelayStatus(url, 'error');
        this.broadcastRelayStatus();
        console.error(`Error with relay ${url}:`, error);

        // Schedule reconnection
        this.scheduleReconnection(url);
      });

    } catch (error) {
      relay.status = 'error';
      storage.updateRelayStatus(url, 'error');
      this.broadcastRelayStatus();
      console.error(`Failed to connect to relay ${url}:`, error);
      this.scheduleReconnection(url);
    }
  }

  private scheduleReconnection(url: string): void {
    // Clear existing reconnection timer
    const existingTimeout = this.reconnectIntervals.get(url);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule reconnection in 5 seconds
    const timeout = setTimeout(() => {
      this.connectToRelay(url);
      this.reconnectIntervals.delete(url);
    }, 5000);

    this.reconnectIntervals.set(url, timeout);
  }

  private subscribeToNotes(url: string): void {
    const relay = this.relays.get(url);
    if (!relay || !relay.ws || relay.ws.readyState !== WebSocket.OPEN) return;

    const subscriptionId = `notes_${Date.now()}`;
    relay.subscriptions.add(subscriptionId);

    const subscription = [
      "REQ",
      subscriptionId,
      {
        kinds: [1], // Text notes
        limit: 100
      }
    ];

    relay.ws.send(JSON.stringify(subscription));
  }

  private handleRelayMessage(relayUrl: string, message: any[]): void {
    if (!Array.isArray(message) || message.length < 2) return;

    const [type, subscriptionId, ...rest] = message;

    switch (type) {
      case "EVENT":
        if (rest.length > 0) {
          this.handleNostrEvent(relayUrl, rest[0] as NostrEvent);
        }
        break;
      case "EOSE":
        console.log(`End of stored events for subscription ${subscriptionId} on ${relayUrl}`);
        break;
      case "NOTICE":
        console.log(`Notice from ${relayUrl}:`, subscriptionId);
        break;
    }
  }

  private async handleNostrEvent(relayUrl: string, event: NostrEvent): Promise<void> {
    try {
      // Calculate Proof of Work
      const { difficulty, score } = this.calculateProofOfWork(event.id);

      // Store the note
      await storage.createNote({
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        kind: event.kind,
        createdAt: event.created_at,
        tags: event.tags.map(tag => JSON.stringify(tag)),
        sig: event.sig,
        powDifficulty: difficulty,
        powScore: score,
      });

      // Broadcast to connected clients
      this.broadcastNewNote(event, difficulty, score);

    } catch (error) {
      console.error('Error handling Nostr event:', error);
    }
  }

  private calculateProofOfWork(eventId: string): { difficulty: number; score: number } {
    let difficulty = 0;
    for (let i = 0; i < eventId.length; i++) {
      if (eventId[i] === '0') {
        difficulty++;
      } else {
        break;
      }
    }
    const score = Math.pow(16, difficulty);
    return { difficulty, score };
  }

  private broadcastNewNote(event: NostrEvent, difficulty: number, score: number): void {
    const message = {
      type: 'new_note',
      data: {
        ...event,
        powDifficulty: difficulty,
        powScore: score,
      }
    };

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private broadcastRelayStatus(): void {
    const relayStatuses: RelayStatus[] = Array.from(this.relays.values()).map(relay => ({
      url: relay.url,
      status: relay.status,
      latency: relay.latency,
      lastPing: relay.lastPing
    }));

    const message = {
      type: 'relay_status',
      data: relayStatuses
    };

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    
    // Send current relay status to new client
    this.broadcastRelayStatus();

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Error parsing client message:', error);
      }
    });
  }

  private async handleClientMessage(ws: WebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'add_relay':
        if (message.url) {
          await this.addRelay(message.url);
        }
        break;
      case 'remove_relay':
        if (message.url) {
          await this.removeRelay(message.url);
        }
        break;
      case 'get_notes':
        await this.sendNotesToClient(ws, message);
        break;
    }
  }

  private async removeRelay(url: string): Promise<void> {
    const relay = this.relays.get(url);
    if (relay) {
      if (relay.ws) {
        relay.ws.close();
      }
      this.relays.delete(url);
      await storage.deleteRelay(url);
      this.broadcastRelayStatus();
    }
  }

  private async sendNotesToClient(ws: WebSocket, request: any): Promise<void> {
    const { limit, offset, minPowDifficulty, sortBy } = request;
    const notes = await storage.getNotes(limit, offset, minPowDifficulty, sortBy);
    
    const response = {
      type: 'notes_response',
      data: notes
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  getRelayStatuses(): RelayStatus[] {
    return Array.from(this.relays.values()).map(relay => ({
      url: relay.url,
      status: relay.status,
      latency: relay.latency,
      lastPing: relay.lastPing
    }));
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const relayManager = new NostrRelayManager();

  // REST API routes
  app.get("/api/notes", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const minPowDifficulty = parseInt(req.query.minPowDifficulty as string) || 0;
      const sortBy = req.query.sortBy as string || "pow_desc";

      const notes = await storage.getNotes(limit, offset, minPowDifficulty, sortBy);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/relays", async (req, res) => {
    try {
      const relays = await storage.getRelays();
      const statuses = relayManager.getRelayStatuses();
      
      const relaysWithStatus = relays.map(relay => {
        const status = statuses.find(s => s.url === relay.url);
        return {
          ...relay,
          status: status?.status || 'disconnected',
          latency: status?.latency
        };
      });

      res.json(relaysWithStatus);
    } catch (error) {
      console.error("Error fetching relays:", error);
      res.status(500).json({ error: "Failed to fetch relays" });
    }
  });

  app.post("/api/relays", async (req, res) => {
    try {
      const validatedData = insertNostrRelaySchema.parse(req.body);
      await relayManager.addRelay(validatedData.url);
      const relay = await storage.createRelay(validatedData);
      res.status(201).json(relay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid relay data", details: error.errors });
      } else {
        console.error("Error adding relay:", error);
        res.status(500).json({ error: "Failed to add relay" });
      }
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const notes = await storage.getNotes(1000); // Get recent notes for stats
      const totalNotes = notes.length;
      const avgPow = totalNotes > 0 ? notes.reduce((sum, note) => sum + note.powDifficulty, 0) / totalNotes : 0;
      const highPowNotes = notes.filter(note => note.powDifficulty >= 8).length;

      res.json({
        totalNotes,
        avgPow: Math.round(avgPow * 10) / 10,
        highPowNotes
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    relayManager.addClient(ws);
  });

  return httpServer;
}
