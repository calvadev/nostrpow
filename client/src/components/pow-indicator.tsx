import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Hammer } from "lucide-react";
import { getPoWLevel, getPoWColor, calculateProofOfWork } from "@/lib/nostr";

interface PoWIndicatorProps {
  noteId: string;
  powDifficulty: number;
  powScore: number;
  className?: string;
}

export function PoWIndicator({ noteId, powDifficulty, powScore, className = "" }: PoWIndicatorProps) {
  const level = getPoWLevel(powDifficulty);
  const { hash, percentage } = calculateProofOfWork(noteId);
  
  const levelColors = {
    high: "bg-green-500 text-white",
    medium: "bg-yellow-500 text-slate-900",
    low: "bg-slate-600 text-slate-300"
  };

  const levelText = {
    high: "HIGH",
    medium: "MED",
    low: "LOW"
  };

  const progressColors = {
    high: "bg-gradient-to-r from-green-500 to-emerald-400",
    medium: "bg-gradient-to-r from-yellow-500 to-orange-400",
    low: "bg-gradient-to-r from-slate-500 to-slate-400"
  };

  return (
    <div className={`bg-slate-900 rounded-lg p-3 border border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Hammer className={`h-4 w-4 ${level === 'high' ? 'text-green-500' : level === 'medium' ? 'text-yellow-500' : 'text-slate-500'}`} />
          <span className="text-xs font-medium text-slate-300">Proof of Work</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold ${level === 'high' ? 'text-green-500' : level === 'medium' ? 'text-yellow-500' : 'text-slate-400'}`}>
            {powDifficulty} zeros
          </span>
          <Badge className={`text-xs font-medium ${levelColors[level]}`}>
            {levelText[level]}
          </Badge>
        </div>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full ${progressColors[level]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-slate-400">
        <span>
          Difficulty: <span className="text-slate-300 font-mono">{powScore.toLocaleString()}</span>
        </span>
        <span>
          Hash: <span className="font-mono text-slate-300">{hash}</span>
        </span>
      </div>
    </div>
  );
}
