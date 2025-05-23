import { nostrNotes, nostrRelays, type NostrNote, type InsertNostrNote, type NostrRelay, type InsertNostrRelay } from "@shared/schema";

export interface IStorage {
  // Notes
  createNote(note: InsertNostrNote): Promise<NostrNote>;
  getNotes(limit?: number, offset?: number, minPowDifficulty?: number, sortBy?: string): Promise<NostrNote[]>;
  getNoteById(id: string): Promise<NostrNote | undefined>;
  updateNotePow(id: string, powDifficulty: number, powScore: number): Promise<NostrNote | undefined>;
  
  // Relays
  createRelay(relay: InsertNostrRelay): Promise<NostrRelay>;
  getRelays(): Promise<NostrRelay[]>;
  updateRelayStatus(url: string, status: string, latency?: number): Promise<NostrRelay | undefined>;
  deleteRelay(url: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private notes: Map<string, NostrNote>;
  private relays: Map<string, NostrRelay>;
  private relayIdCounter: number;

  constructor() {
    this.notes = new Map();
    this.relays = new Map();
    this.relayIdCounter = 1;
    
    // Add default relays
    this.createRelay({ url: "wss://relay.damus.io", status: "disconnected" });
    this.createRelay({ url: "wss://nos.lol", status: "disconnected" });
    this.createRelay({ url: "wss://relay.snort.social", status: "disconnected" });
  }

  async createNote(insertNote: InsertNostrNote): Promise<NostrNote> {
    const note: NostrNote = {
      ...insertNote,
      receivedAt: new Date(),
    };
    this.notes.set(note.id, note);
    return note;
  }

  async getNotes(limit = 50, offset = 0, minPowDifficulty = 0, sortBy = "pow_desc"): Promise<NostrNote[]> {
    let notes = Array.from(this.notes.values());
    
    // Filter by minimum PoW difficulty
    if (minPowDifficulty > 0) {
      notes = notes.filter(note => note.powDifficulty >= minPowDifficulty);
    }
    
    // Sort notes
    switch (sortBy) {
      case "pow_desc":
        notes.sort((a, b) => b.powDifficulty - a.powDifficulty);
        break;
      case "pow_asc":
        notes.sort((a, b) => a.powDifficulty - b.powDifficulty);
        break;
      case "time_desc":
        notes.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "time_asc":
        notes.sort((a, b) => a.createdAt - b.createdAt);
        break;
      default:
        notes.sort((a, b) => b.powDifficulty - a.powDifficulty);
    }
    
    return notes.slice(offset, offset + limit);
  }

  async getNoteById(id: string): Promise<NostrNote | undefined> {
    return this.notes.get(id);
  }

  async updateNotePow(id: string, powDifficulty: number, powScore: number): Promise<NostrNote | undefined> {
    const note = this.notes.get(id);
    if (note) {
      note.powDifficulty = powDifficulty;
      note.powScore = powScore;
      this.notes.set(id, note);
      return note;
    }
    return undefined;
  }

  async createRelay(insertRelay: InsertNostrRelay): Promise<NostrRelay> {
    const relay: NostrRelay = {
      id: this.relayIdCounter++,
      ...insertRelay,
      lastConnected: null,
    };
    this.relays.set(relay.url, relay);
    return relay;
  }

  async getRelays(): Promise<NostrRelay[]> {
    return Array.from(this.relays.values());
  }

  async updateRelayStatus(url: string, status: string, latency?: number): Promise<NostrRelay | undefined> {
    const relay = this.relays.get(url);
    if (relay) {
      relay.status = status;
      if (latency !== undefined) {
        relay.latency = latency;
      }
      if (status === "connected") {
        relay.lastConnected = new Date();
      }
      this.relays.set(url, relay);
      return relay;
    }
    return undefined;
  }

  async deleteRelay(url: string): Promise<void> {
    this.relays.delete(url);
  }
}

export const storage = new MemStorage();
