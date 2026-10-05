import React, { useState } from 'react';
import { Question, GamePhase, Difficulty, LightState, Team, SecretTurnStep } from '../types/game';
import { SecretTurnController } from './SecretTurnController';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  SkipForward,
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
  activeTurnIndex: number;
  onActiveTurnChange: (index: number) => void;
  teams: Team[];
  teamAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  onLockTeamAnswer: (teamId: string, answer: 'A' | 'B' | 'C' | 'D') => void;
  turnStep: SecretTurnStep;
  onTurnStepChange: (step: SecretTurnStep) => void;
  onTriggerReveal: () => void;
  onRunAndAdvance: () => void;
  onNextQuestion: () => void;
  onSkipQuestion: () => void;
  hasWinner: boolean;
}

export const LeftQuestionPanel: React.FC<LeftQuestionPanelProps> = ({
  question,
  currentIndex,
  totalQuestions,
  phase,
  lightState,
  isProjectorMode,
  activeTurnIndex,
  onActiveTurnChange,
  teams,
  teamAnswers,
  onLockTeamAnswer,
  turnStep,
  onTurnStepChange,
  onTriggerReveal,
  onRunAndAdvance,
  onNextQuestion,
  onSkipQuestion,
  hasWinner,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (!question) return null;

  const isLocked = lightState === 'RED';

  const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    Hard: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    Bonus: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  // COLLAPSED BAR STATE
  if (isCollapsed) {
    return (
      <div className="pointer-events-auto h-full flex items-start pt-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-r-xl bg-slate-900/95 border-y border-r border-slate-700 text-white hover:bg-slate-800 transition-all shadow-xl group"
          title="Open Question Box"
        >
          <span className="text-xs font-black text-cyan-400 font-mono">Q{currentIndex + 1}</span>
          <span className="text-xs font-bold text-slate-300 group-hover:text-white">Secret Turn</span>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-88 md:w-[440px] flex flex-col max-h-full pointer-events-auto transition-all duration-300 select-none">
      <div className="relative flex flex-col flex-1 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-3.5 md:p-4 text-white overflow-hidden">
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

        {/* TOP STATUS BAR: Question #, Difficulty, Collapse Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 gap-2">
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
            {/* Skip question */}
            <button
              onClick={onSkipQuestion}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Skip question"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

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

        {/* QUESTION PROMPT (Remains visible to the whole class on the projector) */}
        <div className="mb-3">
          <h2
            className={`font-black leading-snug tracking-tight text-slate-100 ${
              isProjectorMode ? 'text-lg md:text-xl' : 'text-sm md:text-base'
            }`}
          >
            {question.question}
          </h2>
        </div>

        {/* SECRET TURN INTERACTION CONTROLLER */}
        <SecretTurnController
          question={question}
          teams={teams}
          activeTurnIndex={activeTurnIndex}
          onActiveTurnChange={onActiveTurnChange}
          teamAnswers={teamAnswers}
          onLockTeamAnswer={onLockTeamAnswer}
          turnStep={turnStep}
          onTurnStepChange={onTurnStepChange}
          onTriggerReveal={onTriggerReveal}
          onRunAndAdvance={onRunAndAdvance}
          onNextQuestion={onNextQuestion}
          isLocked={isLocked}
          isProjectorMode={isProjectorMode}
          hasWinner={hasWinner}
        />
      </div>
    </aside>
  );
};
