import React, { useState } from 'react';
import { Team, AnsweringMode, LightState, GamePhase } from '../types/game';
import { Lock, ChevronDown, ChevronUp, Check, X, Undo2 } from 'lucide-react';

interface TeamAnswerPadProps {
  teams: Team[];
  mode: AnsweringMode;
  activeTeamId: string | null;
  onSelectActiveTeam: (teamId: string) => void;
  teamAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  onTeamAnswer: (teamId: string, option: 'A' | 'B' | 'C' | 'D') => void;
  onTeamQuickGrade?: (teamId: string, isCorrect: boolean) => void;
  onClearTeamAnswer?: (teamId: string) => void;
  onUsePowerCard: (teamId: string) => void;
  lightState: LightState;
  phase: GamePhase;
  isProjectorMode: boolean;
  enablePowerCards: boolean;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

export const TeamAnswerPad: React.FC<TeamAnswerPadProps> = ({
  teams,
  mode,
  activeTeamId,
  onSelectActiveTeam,
  teamAnswers,
  onTeamAnswer,
  onTeamQuickGrade,
  onClearTeamAnswer,
  onUsePowerCard,
  lightState,
  phase,
  enablePowerCards,
  correctAnswer,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const isLocked = lightState === 'RED' || phase !== 'QUESTION_ACTIVE';

  // If user minimized the bottom pad to see the entire 3D arena
  if (isMinimized) {
    return (
      <div className="w-full max-w-xl mx-auto flex items-center justify-center pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-lg text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-all"
          title="Show team answer buttons"
        >
          <span>Show Team Answers Pad</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // MODE 1: TEACHER SELECT (One team at a time)
  if (mode === 'TEACHER_SELECT') {
    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/90 p-2.5 shadow-2xl text-white pointer-events-auto">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Select Team to Answer:
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="Minimize answer pad"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Team selector tabs */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {teams.map(team => {
            const isSelected = activeTeamId === team.id;
            const hasAnswered = teamAnswers[team.id] !== undefined && teamAnswers[team.id] !== null;

            return (
              <button
                key={team.id}
                onClick={() => onSelectActiveTeam(team.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs transition-all ${
                  isSelected
                    ? 'border-white bg-slate-800 text-white shadow-md ring-1 ring-white/50'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
                style={{
                  borderColor: isSelected ? team.color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span>{team.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">#{team.number}</span>
                {hasAnswered && (
                  <span className="text-cyan-400 text-[10px] font-black font-mono">
                    [{teamAnswers[team.id]}]
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ABCD Answer Buttons for Active Team */}
        {activeTeamId && (
          <div className="grid grid-cols-4 gap-2">
            {(['A', 'B', 'C', 'D'] as const).map(opt => {
              const currentChoice = teamAnswers[activeTeamId];
              const isSelected = currentChoice === opt;

              return (
                <button
                  key={opt}
                  disabled={isLocked}
                  onClick={() => onTeamAnswer(activeTeamId, opt)}
                  className={`py-2 rounded-xl font-black text-base transition-all flex items-center justify-center gap-1 ${
                    isLocked
                      ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-95'
                  }`}
                >
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // MODE 2: ALL TEAMS ANSWER SIMULTANEOUSLY (Default for classrooms)
  const totalAnswered = teams.filter(t => teamAnswers[t.id] !== undefined && teamAnswers[t.id] !== null).length;

  return (
    <div className="w-full max-w-4xl mx-auto text-white pointer-events-auto">
      {/* Red light warning indicator */}
      {isLocked && lightState === 'RED' && (
        <div className="mb-1 py-1 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
          <Lock className="w-3.5 h-3.5" />
          <span>RED LIGHT! FREEZE! Answer buttons locked until Green Light.</span>
        </div>
      )}

      {/* Helper header bar */}
      <div className="flex items-center justify-between gap-2 mb-1 px-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">
            Team Answers ({totalAnswered}/{teams.length} submitted):
          </span>
          <span className="text-slate-500 text-[10px] hidden sm:inline">
            (Only teams with correct answer will move forward)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
            title="Minimize answer pad to unblock 3D arena view"
          >
            <span>Hide Pad</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Slim Team Cards Grid */}
      <div className={`grid gap-2 ${teams.length > 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {teams.map(team => {
          const choice = teamAnswers[team.id];
          const hasAnswered = choice !== null && choice !== undefined;
          const power = team.powerCard;
          const isActive = activeTeamId === team.id;

          return (
            <div
              key={team.id}
              onClick={() => onSelectActiveTeam(team.id)}
              className={`relative rounded-xl bg-slate-900/95 backdrop-blur-md border p-2 flex flex-col justify-between shadow-md transition-all cursor-pointer ${
                isActive
                  ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-500/10'
                  : 'border-slate-700/80 hover:border-slate-600'
              }`}
              style={{
                borderLeft: `3.5px solid ${team.color}`,
              }}
            >
              {/* Team Info Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-extrabold text-xs truncate text-slate-100">
                    {team.name}
                  </span>
                </div>

                {hasAnswered ? (
                  <span
                    className="px-1.5 py-0.2 rounded text-[10px] font-black"
                    style={{ backgroundColor: `${team.color}30`, color: '#ffffff' }}
                  >
                    Ans: {choice}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold">Pick</span>
                )}
              </div>

              {/* 4 Choices A, B, C, D */}
              <div className="grid grid-cols-4 gap-1 mb-1">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const isSelected = choice === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isLocked}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectActiveTeam(team.id);
                        onTeamAnswer(team.id, opt);
                      }}
                      className={`h-6 rounded-md font-black text-xs transition-all ${
                        isLocked
                          ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'text-slate-950 font-black shadow-md ring-2 ring-white scale-105'
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

              {/* Teacher Quick Grade Shortcuts (Pass/Fail) */}
              <div
                className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80 text-[10px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 w-full">
                  <button
                    type="button"
                    disabled={isLocked || !correctAnswer}
                    onClick={() => {
                      if (onTeamQuickGrade) {
                        onTeamQuickGrade(team.id, true);
                      } else if (correctAnswer) {
                        onTeamAnswer(team.id, correctAnswer);
                      }
                    }}
                    className={`flex-1 py-0.5 px-1 rounded flex items-center justify-center gap-0.5 text-[9px] font-black transition-all ${
                      hasAnswered && choice === correctAnswer
                        ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                    title={`Mark ${team.name} as Correct (Answers ${correctAnswer || ''})`}
                  >
                    <Check className="w-2.5 h-2.5" />
                    <span>Correct</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (onTeamQuickGrade) {
                        onTeamQuickGrade(team.id, false);
                      } else if (onClearTeamAnswer) {
                        onClearTeamAnswer(team.id);
                      }
                    }}
                    className={`flex-1 py-0.5 px-1 rounded flex items-center justify-center gap-0.5 text-[9px] font-bold transition-all ${
                      hasAnswered && choice !== correctAnswer
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                    title={`Mark ${team.name} as Wrong / Stay`}
                  >
                    <X className="w-2.5 h-2.5" />
                    <span>Stay</span>
                  </button>

                  {hasAnswered && onClearTeamAnswer && (
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => onClearTeamAnswer(team.id)}
                      className="p-0.5 rounded text-slate-400 hover:text-white bg-slate-800/80"
                      title="Clear answer"
                    >
                      <Undo2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Power card trigger if enabled */}
              {enablePowerCards && power && (
                <div
                  className="mt-1 pt-1 border-t border-slate-800/70 flex items-center justify-between text-[10px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-slate-400 truncate flex items-center gap-1">
                    <span>{power.icon}</span>
                    <span className="truncate">{power.name}</span>
                  </span>
                  <button
                    type="button"
                    disabled={isLocked || power.used}
                    onClick={() => onUsePowerCard(team.id)}
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase transition-all ${
                      power.used
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    {power.used ? 'Used' : 'Use'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
