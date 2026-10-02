import React, { useState } from 'react';
import { Question, GamePhase, Difficulty, Team } from '../types/game';
import { Sparkles, CheckCircle2, XCircle, Clock, ChevronUp, ChevronDown, Eye, Maximize2, Minimize2 } from 'lucide-react';

interface QuizOverlayProps {
  question: Question | null;
  currentIndex: number;
  totalQuestions: number;
  phase: GamePhase;
  timerRemaining: number | null;
  timerDuration: number;
  isProjectorMode: boolean;
  onSelectOptionForActiveTeam?: (option: 'A' | 'B' | 'C' | 'D') => void;
  activeTeamId?: string | null;
  onSelectActiveTeam?: (teamId: string) => void;
  teamAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  answeringDisabled?: boolean;
  teams?: Team[];
  isArenaFocused?: boolean;
  onToggleArenaFocus?: () => void;
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  question,
  currentIndex,
  totalQuestions,
  phase,
  timerRemaining,
  timerDuration,
  isProjectorMode,
  onSelectOptionForActiveTeam,
  activeTeamId,
  onSelectActiveTeam,
  teamAnswers,
  answeringDisabled,
  teams = [],
  isArenaFocused = false,
  onToggleArenaFocus,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!question) return null;

  const isRevealed = phase === 'ANSWER_REVEAL' || phase === 'MOVING_AVATARS';
  const isMoving = phase === 'MOVING_AVATARS';

  const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    Hard: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    Bonus: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  const timerPercent = timerDuration > 0 && timerRemaining !== null
    ? (timerRemaining / timerDuration) * 100
    : 100;

  const currentActiveTeam = teams.find(t => t.id === activeTeamId) || teams[0];
  const activeTeamChoice = currentActiveTeam ? teamAnswers[currentActiveTeam.id] : null;

  // 1. AUTO-MINIMIZED BANNER DURING AVATAR MOVEMENT (100% of 3D Track & Hana Visible!)
  if (isMoving) {
    const movingTeams = teams.filter(t => t.lastAnswerCorrect && (t.lastStepDelta || 0) > 0);
    const stayingTeams = teams.filter(t => !t.lastAnswerCorrect);

    return (
      <div className="w-full max-w-3xl mx-auto transition-all duration-300 animate-fadeIn pointer-events-auto">
        <div className="rounded-2xl bg-slate-950/90 backdrop-blur-xl border-2 border-emerald-400 px-4 py-2 shadow-2xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 shrink-0">
            <span className="text-lg animate-bounce">🏃</span>
            <span className="hidden sm:inline">RACE MOVEMENT:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold flex-1">
            {movingTeams.length > 0 ? (
              movingTeams.map(t => (
                <span
                  key={t.id}
                  className="px-2.5 py-0.5 rounded-lg border font-black text-xs shadow-sm flex items-center gap-1.5 animate-pulse"
                  style={{
                    backgroundColor: `${t.color}30`,
                    borderColor: t.color,
                    color: '#ffffff',
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span>{t.name}: +{t.lastStepDelta} {t.lastStepDelta === 1 ? 'Step' : 'Steps'} 🏃</span>
                </span>
              ))
            ) : (
              <span className="text-slate-300 text-xs">No team answered correctly — All stay in place! 🛑</span>
            )}

            {stayingTeams.map(t => (
              <span
                key={t.id}
                className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-400 text-[11px]"
              >
                {t.name} stays
              </span>
            ))}
          </div>

          <span className="text-[10px] text-slate-400 shrink-0 hidden md:inline">
            Correct: <span className="font-bold text-emerald-300">{question.correctAnswer}</span>
          </span>
        </div>
      </div>
    );
  }

  // 2. ULTRA-COMPACT 1-LINE TICKER (When user clicks Minimize or Arena Focus is ON)
  if (isMinimized || isArenaFocused) {
    return (
      <div className="w-full max-w-4xl mx-auto pointer-events-auto transition-all duration-200">
        <div className="rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 shadow-lg text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate flex-1">
            <span className="text-xs font-black text-cyan-400 shrink-0 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
              Q{currentIndex + 1}/{totalQuestions}
            </span>
            <span className="text-xs font-bold text-slate-100 truncate">
              {question.question}
            </span>
            {isRevealed && (
              <span className="text-xs font-black text-emerald-400 shrink-0">
                (Ans: {question.correctAnswer}. {question.options[question.correctAnswer]})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {timerDuration > 0 && timerRemaining !== null && (
              <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">
                ⏱ {timerRemaining}s
              </span>
            )}
            <button
              onClick={() => {
                setIsMinimized(false);
                if (isArenaFocused && onToggleArenaFocus) onToggleArenaFocus();
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-black text-slate-950 shrink-0 transition-all shadow"
              title="Expand Question Card"
            >
              <span>Show Question</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. SLEEK BROADCAST HUD (Compact, elevated, leaves >75% of 3D arena open)
  return (
    <div
      className={`w-full max-w-3xl mx-auto transition-all duration-300 pointer-events-auto ${
        isProjectorMode ? 'max-w-4xl' : ''
      }`}
    >
      <div className="relative rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 shadow-2xl p-3 md:p-3.5 text-white overflow-hidden">
        {/* Glow accent bar based on difficulty */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            question.difficulty === 'Bonus'
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500'
              : question.difficulty === 'Hard'
              ? 'bg-rose-500'
              : question.difficulty === 'Medium'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Top Mini Bar: Q#, Difficulty, Active Team Selector & Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 gap-2 text-xs">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-black tracking-wider uppercase text-cyan-400 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">
              Q{currentIndex + 1}/{totalQuestions}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                difficultyColors[question.difficulty]
              }`}
            >
              {question.difficulty === 'Bonus' && <Sparkles className="w-3 h-3" />}
              {question.difficulty} · +{question.movementSteps}{' '}
              {question.movementSteps === 1 ? 'Step' : 'Steps'}
            </span>

            {/* Team Picker Tabs right on question bar */}
            {teams.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 ml-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 px-1 font-semibold">Answering:</span>
                {teams.map(t => {
                  const isCur = t.id === currentActiveTeam?.id;
                  const ans = teamAnswers[t.id];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectActiveTeam && onSelectActiveTeam(t.id)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                        isCur
                          ? 'text-white shadow ring-1 ring-white/60'
                          : 'text-slate-400 hover:text-slate-200 opacity-70'
                      }`}
                      style={{
                        backgroundColor: isCur ? `${t.color}35` : 'transparent',
                        borderColor: isCur ? t.color : 'transparent',
                      }}
                      title={`Select ${t.name} to choose their answer`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span>{t.name}</span>
                      {ans && (
                        <span className="text-[9px] font-mono font-black text-cyan-300">
                          [{ans}]
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Question Timer */}
            {timerDuration > 0 && timerRemaining !== null && (
              <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700">
                <Clock
                  className={`w-3 h-3 ${
                    timerRemaining <= 5 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
                  }`}
                />
                <span
                  className={`font-mono font-black text-xs ${
                    timerRemaining <= 5 ? 'text-rose-400' : 'text-slate-100'
                  }`}
                >
                  {timerRemaining}s
                </span>
              </div>
            )}

            {/* Minimize button to give class 100% view of 3D arena */}
            <button
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
              title="Minimize question to view 3D arena track & Hana"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px]">View Arena</span>
              <ChevronUp className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Question Prompt */}
        <h2
          className={`font-extrabold leading-snug tracking-tight text-slate-100 mb-2.5 text-balance ${
            isProjectorMode ? 'text-base md:text-lg' : 'text-sm md:text-base'
          }`}
        >
          {question.question}
        </h2>

        {/* 4 Compact Horizontal Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['A', 'B', 'C', 'D'] as const).map(letter => {
            const text = question.options[letter];
            const isCorrect = question.correctAnswer === letter;
            const isSelectedByActiveTeam = activeTeamChoice === letter;

            let cardStyle =
              'bg-slate-800/90 border-slate-700 text-slate-100 hover:border-cyan-400 hover:bg-slate-800 cursor-pointer active:scale-98';
            let badgeStyle = 'bg-slate-700 text-slate-200';

            if (isSelectedByActiveTeam && !isRevealed) {
              cardStyle =
                'bg-cyan-950/90 border-cyan-400 text-cyan-100 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/20';
              badgeStyle = 'bg-cyan-400 text-slate-950 font-black';
            }

            if (isRevealed) {
              if (isCorrect) {
                cardStyle =
                  'bg-emerald-950/80 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400 shadow-md shadow-emerald-500/20 cursor-default';
                badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
              } else {
                cardStyle =
                  'bg-slate-900/40 border-slate-800 text-slate-500 opacity-40 cursor-default';
                badgeStyle = 'bg-slate-800 text-slate-600';
              }
            }

            return (
              <button
                key={letter}
                type="button"
                disabled={answeringDisabled || isRevealed}
                onClick={() => onSelectOptionForActiveTeam && onSelectOptionForActiveTeam(letter)}
                className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-200 ${cardStyle}`}
                title={`Set answer ${letter} for ${currentActiveTeam?.name || 'team'}`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center font-black text-xs shrink-0 ${badgeStyle}`}
                >
                  {letter}
                </div>
                <div className="font-bold text-xs truncate flex-1 leading-tight">
                  {text}
                </div>
                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {isRevealed && !isCorrect && (
                  <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Live Team Results Breakdown during Reveal */}
        {isRevealed && teams && teams.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[11px]">Round Results:</span>
              {teams.map(t => {
                const isCorrect = t.lastAnswerCorrect;
                const steps = t.lastStepDelta || 0;
                return (
                  <span
                    key={t.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                      isCorrect
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span>{t.name}:</span>
                    {isCorrect ? (
                      <span className="text-emerald-400 font-black">+{steps} Steps 🏃</span>
                    ) : (
                      <span className="text-slate-400">Stays 🛑</span>
                    )}
                  </span>
                );
              })}
            </div>

            {question.explanation && (
              <span className="text-slate-400 text-[11px] truncate max-w-sm">
                💡 <span className="font-bold text-slate-300">Explanation: </span>
                {question.explanation}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
