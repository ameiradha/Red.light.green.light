import React, { useState } from 'react';
import { Team } from '../types/game';
import { Trophy, ChevronDown, ChevronUp, Flame } from 'lucide-react';

interface ScoreboardProps {
  teams: Team[];
  trackLength: number;
  isProjectorMode: boolean;
  onOpenLeaderboardModal?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  teams,
  trackLength,
  isProjectorMode,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Sort by position first (closest to finish line), then by score
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.position !== a.position) {
      return b.position - a.position;
    }
    return b.score - a.score;
  });

  const leader = sortedTeams[0];

  // COLLAPSED COMPACT PILL (Leaves 100% of the track visible)
  if (!isExpanded) {
    return (
      <div className="pointer-events-auto">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-lg text-white hover:bg-slate-800/90 transition-all text-xs group"
          title="Click to view full race leaderboard"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-slate-300">Leader:</span>
          {leader && (
            <div className="flex items-center gap-1.5 font-extrabold">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: leader.color }}
              />
              <span className="text-white">{leader.name}</span>
              <span className="text-cyan-400 font-mono text-[11px]">
                ({leader.position}/{trackLength})
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 border-l border-slate-700 pl-2 ml-1">
            <span>Ranks</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </button>
      </div>
    );
  }

  // EXPANDED DETAILED SCOREBOARD
  return (
    <div
      className={`rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl p-3 text-white transition-all pointer-events-auto ${
        isProjectorMode ? 'text-sm' : 'text-xs'
      }`}
    >
      {/* Header with Collapse Button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-black uppercase tracking-wider text-slate-200">
            Leaderboard
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-mono">Goal: {trackLength}m</span>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Collapse leaderboard"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Teams list */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {sortedTeams.map((team, rank) => {
          const progressPercent = Math.min((team.position / trackLength) * 100, 100);
          const isLeader = rank === 0 && team.position > 0;

          return (
            <div
              key={team.id}
              className={`rounded-xl p-1.5 transition-all ${
                isLeader
                  ? 'bg-slate-800/90 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-800/40 border border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center font-black text-[10px] shrink-0 ${
                      rank === 0
                        ? 'bg-amber-400 text-slate-950'
                        : rank === 1
                        ? 'bg-slate-300 text-slate-950'
                        : rank === 2
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {rank + 1}
                  </span>

                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: team.color }}
                  />

                  <span className="font-extrabold truncate text-slate-100 text-[11px]">
                    {team.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    #{team.number}
                  </span>

                  {team.streak >= 2 && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold">
                      <Flame className="w-2.5 h-2.5 text-amber-400" />
                      <span>{team.streak}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-right text-[10px]">
                  <span className="text-slate-300 font-bold">
                    {team.position}/{trackLength}m
                  </span>
                  <span className="text-cyan-400 font-black">
                    {team.score}pt
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950/80 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(progressPercent, 3)}%`,
                    backgroundColor: team.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
