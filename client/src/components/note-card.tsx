import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Repeat2, Share } from "lucide-react";
import { PoWIndicator } from "./pow-indicator";
import { formatTimestamp, getAuthorInitials, truncatePublicKey, getPoWLevel, getPoWBorderColor } from "@/lib/nostr";
import { type NostrNote } from "@shared/schema";

interface NoteCardProps {
  note: NostrNote;
  onClick?: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const level = getPoWLevel(note.powDifficulty);
  const borderColor = getPoWBorderColor(level);
  const initials = getAuthorInitials(note.pubkey);
  const timestamp = formatTimestamp(note.createdAt);
  const authorName = truncatePublicKey(note.pubkey);

  // Generate gradient color for avatar based on pubkey
  const getAvatarGradient = (pubkey: string) => {
    const hash = pubkey.substring(0, 6);
    const hue1 = parseInt(hash.substring(0, 2), 16) % 360;
    const hue2 = parseInt(hash.substring(2, 4), 16) % 360;
    return `from-[hsl(${hue1},70%,50%)] to-[hsl(${hue2},70%,60%)]`;
  };

  return (
    <Card 
      className={`bg-slate-800 border-l-4 ${borderColor} hover:bg-slate-750 transition-colors cursor-pointer`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Author Avatar */}
          <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(note.pubkey)} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-medium">{initials}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Note Header */}
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="text-sm font-medium text-slate-200 truncate">
                {authorName}
              </h4>
              <span className="text-xs text-slate-500">
                {timestamp}
              </span>
            </div>
            
            {/* Note Content */}
            <div className="text-sm text-slate-300 mb-3 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </div>
            
            {/* PoW Indicator */}
            <PoWIndicator 
              noteId={note.id}
              powDifficulty={note.powDifficulty}
              powScore={note.powScore}
              className="mb-3"
            />
            
            {/* Note Actions */}
            <div className="flex items-center space-x-4 text-slate-500">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-1 hover:text-red-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle like
                }}
              >
                <Heart className="h-4 w-4 mr-1" />
                <span className="text-xs">0</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-1 hover:text-green-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle repost
                }}
              >
                <Repeat2 className="h-4 w-4 mr-1" />
                <span className="text-xs">0</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-1 hover:text-blue-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle share
                  navigator.clipboard.writeText(`nostr:${note.id}`);
                }}
              >
                <Share className="h-4 w-4 mr-1" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
