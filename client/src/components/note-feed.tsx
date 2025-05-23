import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Circle } from "lucide-react";
import { NoteCard } from "./note-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotes, useNostr } from "@/hooks/use-nostr";

interface NoteFeedProps {
  sortBy: string;
  minPowDifficulty: number;
  searchQuery: string;
}

export function NoteFeed({ sortBy, minPowDifficulty, searchQuery }: NoteFeedProps) {
  const [offset, setOffset] = useState(0);
  const limit = 20;
  
  const { isConnected } = useNostr();
  const { data: notes = [], isLoading, refetch, isFetching } = useNotes({
    limit,
    offset,
    minPowDifficulty,
    sortBy
  });

  // Filter notes by search query
  const filteredNotes = notes.filter(note => 
    !searchQuery || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.pubkey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setOffset(0);
    refetch();
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  return (
    <div className="space-y-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Note Feed</h2>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center text-xs text-slate-400">
            <Circle className={`h-2 w-2 mr-1 fill-current ${isConnected ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start space-x-3">
                <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-1/4 bg-slate-700" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full bg-slate-700" />
                    <Skeleton className="h-3 w-3/4 bg-slate-700" />
                  </div>
                  <Skeleton className="h-16 w-full bg-slate-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Notes Feed */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-2">No notes found</div>
              <div className="text-slate-500 text-sm">
                {searchQuery ? 'Try adjusting your search query' : 'Waiting for notes from relays...'}
              </div>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note}
                onClick={() => {
                  // Handle note click - could open detailed view
                  console.log('Note clicked:', note.id);
                }}
              />
            ))
          )}
          
          {/* Load More Button */}
          {filteredNotes.length > 0 && filteredNotes.length >= limit && (
            <div className="text-center py-6">
              <Button 
                onClick={handleLoadMore}
                variant="outline"
                disabled={isFetching}
                className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300"
              >
                {isFetching ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <span className="mr-2">↓</span>
                )}
                Load More Notes
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
