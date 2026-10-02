import React, { useState } from 'react';
import { Team, GamePhase, LightState } from '../types/game';
import {
  Trophy,
  Flame,
  ChevronRight,
  ChevronLeft,
  Lock,
  Users,
} from 'lucide-react';

interface RightTeamsPanelProps {
  teams: Team[];
  trackLength: number;
  activeTeamId: string | null;
  onSelectActiveTeam: (teamId: string) => void;
  teamAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  onTeamAnswer: (teamId: string, option: 'A' | 'B' | 'C' | 'D') => void;
  onClearTeamAnswer?: (teamId: string) => void;
  onUsePowerCard: (teamId: string) => void;
  lightState: LightState;
  phase: GamePhase;
  isProjectorMode: boolean;
  enablePowerCards: boolean;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

export const RightTeamsPanel: React.FC<RightTeamsPanelProps> = ({
  teams,
  trackLength,
  activeTeamId,
  onSelectActiveTeam,
  teamAnswers,
  onTeamAnswer,
  onUsePowerCard,
  lightState,
  phase,
  enablePowerCards,
  correctAnswer,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const isLocked = lightState === 'RED';
  const isRevealed = phase === 'ANSWER_REVEAL' || phase === 'MOVING_AVATARS';

  // Sort teams by position for leaderboard ranking
  const sortedByRank = [...teams].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  });

  const totalAnswered = teams.filter(
    t => teamAnswers[t.id] !== undefined && teamAnswers[t.id] !== null
  ).length;

  // COLLAPSED BAR STATE
  if (isCollapsed) {
    return (
      <div className="pointer-events-auto h-full flex items-start pt-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-l-xl bg-slate-900/95 border-y border-l border-slate-700 text-white hover:bg-slate-800 transition-all shadow-xl group"
          title="Open Team Answers Box"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300 group-hover:text-white">
            Teams ({totalAnswered}/{teams.length})
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 md:w-92 flex flex-col max-h-full pointer-events-auto transition-all duration-300 select-none">
      <div className="relative flex flex-col flex-1 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-3 md:p-3.5 text-white overflow-hidden">
        {/* Glow Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

        {/* HEADER: Title, Stats, Collapse Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-black uppercase tracking-wider text-xs md:text-sm text-slate-100">
              Team Answers
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">
              {totalAnswered}/{teams.length} submitted
            </span>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Minimize team answers box"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RED LIGHT FREEZE WARNING */}
        {isLocked && (
          <div className="mb-2 py-1 px-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
            <Lock className="w-3 h-3" />
            <span>RED LIGHT! FREEZE! Answers locked.</span>
          </div>
        )}

        {/* SCROLLABLE TEAM CARDS LIST */}
        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
          {teams.map((team) => {
            const choice = teamAnswers[team.id];
            const hasAnswered = choice !== null && choice !== undefined;
            const isActive = activeTeamId === team.id;
            const progressPercent = Math.min((team.position / trackLength) * 100, 100);

            return (
              <div
                key={team.id}
                onClick={() => onSelectActiveTeam(team.id)}
                className={`relative rounded-xl bg-slate-800/60 border p-2.5 flex flex-col justify-between shadow-md transition-all cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-500/10 bg-slate-800/90'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
                style={{
                  borderLeft: `4px solid ${team.color}`,
                }}
              >
                {/* Team Info Header: Name, Number, Streak, Distance */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-extrabold text-xs text-slate-100 truncate">
                      {team.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      #{team.number}
                    </span>

                    {team.streak >= 2 && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black">
                        <Flame className="w-2.5 h-2.5 text-amber-400" />
                        <span>{team.streak}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      Step {team.position}/{trackLength}m
                    </span>

                    {hasAnswered ? (
                      <span
                        className="px-2 py-0.5 rounded font-black text-xs shadow-sm"
                        style={{
                          backgroundColor: `${team.color}35`,
                          color: '#ffffff',
                        }}
                      >
                        Ans: {choice}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-bold border border-slate-700">
                        Pick A-D
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar towards finish line */}
                <div className="w-full bg-slate-950/80 h-1.5 rounded-full mb-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(progressPercent, 4)}%`,
                      backgroundColor: team.color,
                    }}
                  />
                </div>

                {/* 4 CLEAN ABCD ANSWER BUTTONS (No spoilers, no Correct/Stay indicators!) */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const isSelected = choice === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isLocked}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectActiveTeam(team.id);
                          onTeamAnswer(team.id, opt);
                        }}
                        className={`h-8 rounded-lg font-black text-xs transition-all flex items-center justify-center ${
                          isLocked
                            ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                            : isSelected
                            ? 'text-slate-950 font-black shadow-md ring-2 ring-white scale-102'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95'
                        }`}
                        style={{
                          backgroundColor: isSelected ? team.color : undefined,
                        }}
                        title={`Select answer ${opt} for ${team.name}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Power card trigger if enabled */}
                {enablePowerCards && team.powerCard && (
                  <div
                    className="mt-2 pt-1.5 border-t border-slate-800/70 flex items-center justify-between text-[10px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="text-slate-400 truncate flex items-center gap-1">
                      <span>{team.powerCard.icon}</span>
                      <span className="truncate">{team.powerCard.name}</span>
                    </span>
                    <button
                      type="button"
                      disabled={isLocked || team.powerCard.used}
                      onClick={() => onUsePowerCard(team.id)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                        team.powerCard.used
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                    >
                      {team.powerCard.used ? 'Used' : 'Use'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM SUMMARY FOOTER */}
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leader:</span>
            {sortedByRank[0] && (
              <span className="text-white font-black flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: sortedByRank[0].color }}
                />
                <span>{sortedByRank[0].name}</span>
                <span className="text-cyan-400 font-mono">
                  ({sortedByRank[0].position}/{trackLength}m)
                </span>
              </span>
            )}
          </div>

          <span className="font-mono text-slate-500 text-[10px]">
            Goal: Step {trackLength} 🏁
          </span>
        </div>
      </div>
    </aside>
  );
};
