import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nostrNotes = pgTable("nostr_notes", {
  id: text("id").primaryKey(), // Nostr event ID
  pubkey: text("pubkey").notNull(), // Author's public key
  content: text("content").notNull(),
  kind: integer("kind").notNull(),
  createdAt: integer("created_at").notNull(), // Unix timestamp
  tags: text("tags").array().default([]), // JSON array of tags
  sig: text("sig").notNull(), // Event signature
  powDifficulty: integer("pow_difficulty").notNull().default(0), // Number of leading zeros
  powScore: integer("pow_score").notNull().default(0), // 16^difficulty
  receivedAt: timestamp("received_at").defaultNow(),
});

export const nostrRelays = pgTable("nostr_relays", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, error
  latency: integer("latency"), // in milliseconds
  lastConnected: timestamp("last_connected"),
});

export const insertNostrNoteSchema = createInsertSchema(nostrNotes).pick({
  id: true,
  pubkey: true,
  content: true,
  kind: true,
  createdAt: true,
  tags: true,
  sig: true,
  powDifficulty: true,
  powScore: true,
});

export const insertNostrRelaySchema = createInsertSchema(nostrRelays).pick({
  url: true,
  status: true,
  latency: true,
});

export type InsertNostrNote = z.infer<typeof insertNostrNoteSchema>;
export type NostrNote = typeof nostrNotes.$inferSelect;
export type InsertNostrRelay = z.infer<typeof insertNostrRelaySchema>;
export type NostrRelay = typeof nostrRelays.$inferSelect;

// Nostr event interface
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// WebSocket message types
export interface RelayMessage {
  type: 'EVENT' | 'EOSE' | 'NOTICE' | 'OK' | 'REQ' | 'CLOSE';
  subscriptionId?: string;
  event?: NostrEvent;
  message?: string;
}

export interface RelayStatus {
  url: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  latency?: number;
  lastPing?: number;
}
