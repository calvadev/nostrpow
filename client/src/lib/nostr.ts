import { type NostrEvent } from "@shared/schema";

export interface PoWResult {
  difficulty: number;
  score: number;
  hash: string;
  percentage: number;
}

export function calculateProofOfWork(eventId: string): PoWResult {
  let difficulty = 0;
  for (let i = 0; i < eventId.length; i++) {
    if (eventId[i] === '0') {
      difficulty++;
    } else {
      break;
    }
  }
  
  const score = Math.pow(16, difficulty);
  const hash = eventId.substring(0, 12) + '...';
  const percentage = Math.min((difficulty / 20) * 100, 100);
  
  return { difficulty, score, hash, percentage };
}

export function formatTimestamp(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) {
    return `${Math.floor(diff)}s ago`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  } else {
    return `${Math.floor(diff / 86400)}d ago`;
  }
}

export function truncatePublicKey(pubkey: string, length = 8): string {
  return pubkey.substring(0, length) + '...';
}

export function getAuthorInitials(pubkey: string): string {
  // Generate initials from public key
  const hex = pubkey.substring(0, 4);
  const char1 = String.fromCharCode(65 + (parseInt(hex.substring(0, 2), 16) % 26));
  const char2 = String.fromCharCode(65 + (parseInt(hex.substring(2, 4), 16) % 26));
  return char1 + char2;
}

export function getPoWLevel(difficulty: number): 'low' | 'medium' | 'high' {
  if (difficulty >= 12) return 'high';
  if (difficulty >= 6) return 'medium';
  return 'low';
}

export function getPoWColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high': return 'from-green-500 to-emerald-400';
    case 'medium': return 'from-yellow-500 to-orange-400';
    case 'low': return 'from-slate-500 to-slate-400';
  }
}

export function getPoWBorderColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high': return 'border-green-500';
    case 'medium': return 'border-yellow-500';
    case 'low': return 'border-slate-600';
  }
}
