import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Plus, Circle, Trash2 } from "lucide-react";
import { useNostr, useStats } from "@/hooks/use-nostr";

interface SidebarProps {
  sortBy: string;
  minPowDifficulty: number;
  onSortChange: (value: string) => void;
  onMinPowChange: (value: number) => void;
}

export function Sidebar({ sortBy, minPowDifficulty, onSortChange, onMinPowChange }: SidebarProps) {
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [showAddRelay, setShowAddRelay] = useState(false);
  
  const { relayStatuses, addRelay, removeRelay } = useNostr();
  const { data: stats } = useStats();

  const handleAddRelay = () => {
    if (newRelayUrl.trim()) {
      addRelay(newRelayUrl.trim());
      setNewRelayUrl("");
      setShowAddRelay(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'text-slate-500';
    if (latency < 200) return 'text-green-500';
    if (latency < 1000) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Sort & Filter Controls */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-300">Sort & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Sort by</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="pow_desc">PoW (High to Low)</SelectItem>
                <SelectItem value="pow_asc">PoW (Low to High)</SelectItem>
                <SelectItem value="time_desc">Newest First</SelectItem>
                <SelectItem value="time_asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs text-slate-400 mb-2 block">Min PoW Difficulty</Label>
            <Slider
              value={[minPowDifficulty]}
              onValueChange={(value) => onMinPowChange(value[0])}
              max={20}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span className="font-medium">{minPowDifficulty}</span>
              <span>20</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relay Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-300">Relay Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-3">
            {relayStatuses.map((relay) => (
              <div key={relay.url} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Circle className={`w-2 h-2 fill-current ${getStatusColor(relay.status)}`} />
                  <span className="text-xs text-slate-400 truncate">
                    {relay.url.replace('wss://', '')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {relay.latency && (
                    <span className={`text-xs ${getLatencyColor(relay.latency)}`}>
                      {relay.latency}ms
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRelay(relay.url)}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {showAddRelay ? (
            <div className="space-y-2">
              <Input
                placeholder="wss://relay.example.com"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-200 text-xs"
                onKeyPress={(e) => e.key === 'Enter' && handleAddRelay()}
              />
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleAddRelay}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                >
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowAddRelay(false);
                    setNewRelayUrl("");
                  }}
                  className="flex-1 border-slate-600 text-slate-400 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              size="sm"
              onClick={() => setShowAddRelay(true)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Relay
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Network Stats */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-300">Network Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Total Notes</span>
              <span className="text-xs font-medium text-slate-200">
                {stats?.totalNotes?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Avg PoW</span>
              <span className="text-xs font-medium text-slate-200">
                {stats?.avgPow || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">High PoW Notes</span>
              <span className="text-xs font-medium text-green-500">
                {stats?.highPowNotes || '0'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
