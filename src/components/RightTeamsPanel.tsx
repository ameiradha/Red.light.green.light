import React, { useState } from 'react';
import { Team, GamePhase, LightState } from '../types/game';
import {
  Trophy,
  Flame,
  ChevronRight,
  ChevronLeft,
  Lock,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface RightTeamsPanelProps {
  teams: Team[];
  trackLength: number;
  activeTurnIndex: number;
  teamAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  phase: GamePhase;
  lightState: LightState;
  isProjectorMode: boolean;
  enablePowerCards: boolean;
  onUsePowerCard: (teamId: string) => void;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

export const RightTeamsPanel: React.FC<RightTeamsPanelProps> = ({
  teams,
  trackLength,
  activeTurnIndex,
  teamAnswers,
  phase,
  lightState,
  enablePowerCards,
  onUsePowerCard,
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
    <aside className="w-72 md:w-80 flex flex-col max-h-full pointer-events-auto transition-all duration-300 select-none">
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
              {totalAnswered}/{teams.length} locked
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

        {/* SCROLLABLE TEAM CARDS LIST (STATUS ONLY - ZERO ANSWER LEAKS) */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {teams.map((team, idx) => {
            const rawChoice = teamAnswers[team.id];
            const hasSubmitted = rawChoice !== null && rawChoice !== undefined;
            const isCurrentTurn = idx === activeTurnIndex && !isRevealed && phase === 'QUESTION_ACTIVE';
            const progressPercent = Math.min((team.position / trackLength) * 100, 100);

            // Determine reveal correctness
            const isCorrect = isRevealed && correctAnswer && rawChoice === correctAnswer;

            return (
              <div
                key={team.id}
                className={`relative rounded-xl bg-slate-800/60 border p-2.5 flex flex-col justify-between shadow-md transition-all ${
                  isCurrentTurn
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-500/10 bg-slate-800/95 scale-[1.02]'
                    : hasSubmitted
                    ? 'border-emerald-500/40 bg-slate-800/70'
                    : 'border-slate-700/80 bg-slate-900/50 opacity-80'
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

                  {/* ANTI-CHEATING STATUS BADGE */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isRevealed ? (
                      isCorrect ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>CORRECT</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 font-black text-[11px] flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>WRONG</span>
                        </span>
                      )
                    ) : hasSubmitted ? (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-black text-[11px] flex items-center gap-1 shadow-sm">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>LOCKED</span>
                      </span>
                    ) : isCurrentTurn ? (
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-md shadow-cyan-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                        <span>YOUR TURN</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-[10px] border border-slate-700">
                        WAITING
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar towards finish line */}
                <div className="w-full bg-slate-950/80 h-1.5 rounded-full mb-1.5 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(progressPercent, 4)}%`,
                      backgroundColor: team.color,
                    }}
                  />
                </div>

                {/* Bottom stats row */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Step {team.position}/{trackLength}m</span>
                  <span>Score: {team.score}</span>
                </div>

                {/* Power card trigger if enabled */}
                {enablePowerCards && team.powerCard && (
                  <div
                    className="mt-1.5 pt-1 border-t border-slate-800/70 flex items-center justify-between text-[10px]"
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
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
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
