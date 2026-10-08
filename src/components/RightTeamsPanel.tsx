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
  PlayCircle,
} from 'lucide-react';

interface RightTeamsPanelProps {
  teams: Team[];
  trackLength: number;
  activeTurnIndex: number;
  onSelectActiveTeam: (index: number) => void;
  phase: GamePhase;
  lightState: LightState;
  isProjectorMode: boolean;
  enablePowerCards: boolean;
  onUsePowerCard: (teamId: string) => void;
}

export const RightTeamsPanel: React.FC<RightTeamsPanelProps> = ({
  teams,
  trackLength,
  activeTurnIndex,
  onSelectActiveTeam,
  phase,
  lightState,
  enablePowerCards,
  onUsePowerCard,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const isLocked = lightState === 'RED';

  // Sort teams by position for leaderboard ranking
  const sortedByRank = [...teams].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  });

  // COLLAPSED BAR STATE
  if (isCollapsed) {
    return (
      <div className="pointer-events-auto h-full flex items-start pt-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-l-xl bg-slate-900/95 border-y border-l border-slate-700 text-white hover:bg-slate-800 transition-all shadow-xl group"
          title="Buka Papan Pasukan"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300 group-hover:text-white">
            Pasukan ({teams.length})
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
              Senarai Pasukan
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {teams.length} Pasukan
            </span>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Kecilkan papan pasukan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RED LIGHT FREEZE WARNING */}
        {isLocked && (
          <div className="mb-2 py-1 px-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
            <Lock className="w-3 h-3" />
            <span>LAMPU MERAH! BERHENTI / FREEZE!</span>
          </div>
        )}

        {/* SCROLLABLE TEAM CARDS LIST */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {teams.map((team, idx) => {
            const isCurrentTurn = idx === activeTurnIndex;
            const progressPercent = Math.min((team.position / trackLength) * 100, 100);

            return (
              <div
                key={team.id}
                onClick={() => onSelectActiveTeam(idx)}
                className={`relative rounded-xl border p-2.5 flex flex-col justify-between shadow-md transition-all cursor-pointer ${
                  isCurrentTurn
                    ? 'ring-2 shadow-lg bg-slate-800/95 scale-[1.02]'
                    : 'border-slate-700/80 bg-slate-800/60 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
                style={{
                  borderLeft: `5px solid ${team.color}`,
                  borderColor: isCurrentTurn ? team.color : undefined,
                  boxShadow: isCurrentTurn ? `0 0 15px ${team.color}30` : undefined,
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

                  {/* TURN STATUS BADGE */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrentTurn ? (
                      <span
                        className="px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-md animate-pulse"
                        style={{
                          backgroundColor: team.color,
                          color: '#0f172a',
                        }}
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>GILIRANNYA</span>
                      </span>
                    ) : team.lastAnswerCorrect === true ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[9px] flex items-center gap-0.5 border border-emerald-500/40">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Betul</span>
                      </span>
                    ) : team.lastAnswerCorrect === false ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[9px] flex items-center gap-0.5 border border-rose-500/40">
                        <XCircle className="w-2.5 h-2.5" />
                        <span>Salah</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium text-[9px] border border-slate-700">
                        Menunggu
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
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <span>Langkah {team.position}/{trackLength}m</span>
                  <span>Markah: {team.score}</span>
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
                      {team.powerCard.used ? 'Digunakan' : 'Guna'}
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
            <span>Mendahului:</span>
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
            Sasaran: {trackLength}m 🏁
          </span>
        </div>
      </div>
    </aside>
  );
};
