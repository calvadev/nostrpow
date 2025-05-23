import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Zap, Circle } from "lucide-react";
import { useNostr } from "@/hooks/use-nostr";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const { isConnected, relayStatuses } = useNostr();
  
  const connectedRelays = relayStatuses.filter(relay => relay.status === 'connected').length;
  const totalRelays = relayStatuses.length;

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
              NostrPoW
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
              <span className="text-xs text-slate-400">
                {connectedRelays}/{totalRelays} relays
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
