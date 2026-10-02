import React, { useState } from 'react';
import { Question, GamePhase, Difficulty, LightState, Team } from '../types/game';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  SkipForward,
  Lock,
} from 'lucide-react';

interface LeftQuestionPanelProps {
  question: Question | null;
  currentIndex: number;
  totalQuestions: number;
  phase: GamePhase;
  lightState: LightState;
  timerRemaining: number | null;
  timerDuration: number;
  isProjectorMode: boolean;
  onSelectOptionForActiveTeam?: (option: 'A' | 'B' | 'C' | 'D') => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
  onSkipQuestion: () => void;
  activeTeam?: Team | null;
  teams: Team[];
  teamAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  hasWinner: boolean;
}

export const LeftQuestionPanel: React.FC<LeftQuestionPanelProps> = ({
  question,
  currentIndex,
  totalQuestions,
  phase,
  lightState,
  timerRemaining,
  timerDuration,
  isProjectorMode,
  onSelectOptionForActiveTeam,
  onRevealAnswer,
  onNextQuestion,
  onSkipQuestion,
  activeTeam,
  teams,
  teamAnswers,
  hasWinner,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (!question) return null;

  const isRevealed = phase === 'ANSWER_REVEAL' || phase === 'MOVING_AVATARS';
  const isQuestionActive = phase === 'QUESTION_ACTIVE';
  const isLocked = lightState === 'RED';

  const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    Hard: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    Bonus: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  const timerPercent =
    timerDuration > 0 && timerRemaining !== null
      ? (timerRemaining / timerDuration) * 100
      : 100;

  // COLLAPSED BAR STATE (Allows user to minimize left panel if desired)
  if (isCollapsed) {
    return (
      <div className="pointer-events-auto h-full flex items-start pt-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-r-xl bg-slate-900/95 border-y border-r border-slate-700 text-white hover:bg-slate-800 transition-all shadow-xl group"
          title="Open Question Box"
        >
          <span className="text-xs font-black text-cyan-400 font-mono">Q{currentIndex + 1}</span>
          <span className="text-xs font-bold text-slate-300 group-hover:text-white">Question</span>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 md:w-96 flex flex-col max-h-full pointer-events-auto transition-all duration-300 select-none">
      <div className="relative flex flex-col flex-1 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-4 text-white overflow-hidden">
        {/* Glow accent bar based on difficulty */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            question.difficulty === 'Bonus'
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500'
              : question.difficulty === 'Hard'
              ? 'bg-rose-500'
              : question.difficulty === 'Medium'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* TOP STATUS BAR: Question #, Difficulty, Timer, Collapse Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-xs text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">
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
          </div>

          <div className="flex items-center gap-1.5">
            {/* Collapse button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Minimize question box"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Topic Tag if available */}
        {question.topic && (
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Topic: <span className="text-cyan-300">{question.topic}</span>
          </div>
        )}

        {/* QUESTION PROMPT */}
        <div className="mb-4">
          <h2
            className={`font-black leading-snug tracking-tight text-slate-100 ${
              isProjectorMode ? 'text-lg md:text-xl' : 'text-base md:text-lg'
            }`}
          >
            {question.question}
          </h2>
        </div>

        {/* 4 LARGE VERTICAL OPTION CARDS (A, B, C, D) */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
          {(['A', 'B', 'C', 'D'] as const).map(letter => {
            const text = question.options[letter];
            const isCorrect = question.correctAnswer === letter;
            const isSelectedByActiveTeam = activeTeam && teamAnswers[activeTeam.id] === letter;

            let cardStyle =
              'bg-slate-800/90 border-slate-700 text-slate-100 hover:border-cyan-400 hover:bg-slate-800 cursor-pointer active:scale-99';
            let badgeStyle = 'bg-slate-700 text-slate-200';

            if (isSelectedByActiveTeam && !isRevealed) {
              cardStyle =
                'bg-cyan-950/90 border-cyan-400 text-cyan-100 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/20';
              badgeStyle = 'bg-cyan-400 text-slate-950 font-black';
            }

            if (isRevealed) {
              if (isCorrect) {
                cardStyle =
                  'bg-emerald-950/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400 shadow-md shadow-emerald-500/20 cursor-default';
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
                disabled={isLocked || isRevealed}
                onClick={() => onSelectOptionForActiveTeam && onSelectOptionForActiveTeam(letter)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${cardStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${badgeStyle}`}
                >
                  {letter}
                </div>
                <div className="font-bold text-xs md:text-sm flex-1 leading-tight">
                  {text}
                </div>
                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                )}
                {isRevealed && !isCorrect && (
                  <XCircle className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Note after Reveal */}
        {isRevealed && question.explanation && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className="font-bold text-emerald-400">💡 Explanation: </span>
            <span>{question.explanation}</span>
          </div>
        )}

        {/* PRIMARY ACTION BUTTON: REVEAL ANSWER & RUN ONLY */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
          {isQuestionActive && (
            <button
              onClick={onRevealAnswer}
              className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs md:text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>REVEAL ANSWER & RUN</span>
            </button>
          )}

          {isRevealed && !hasWinner && (
            <div className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs md:text-sm bg-slate-800/90 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2 animate-pulse">
              <span>🏃 SPRINTING TO NEXT QUESTION...</span>
            </div>
          )}

          {isQuestionActive && (
            <button
              onClick={onSkipQuestion}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Skip question"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
