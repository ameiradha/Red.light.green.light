import React, { useState } from 'react';
import { Question, GamePhase, Difficulty, LightState, Team } from '../types/game';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Send,
  ArrowRight,
  Award,
} from 'lucide-react';

interface LeftQuestionPanelProps {
  question: Question | null;
  currentIndex: number;
  totalQuestions: number;
  phase: GamePhase;
  lightState: LightState;
  isProjectorMode: boolean;
  activeTeam: Team;
  nextTeam: Team;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  onSelectOption: (option: 'A' | 'B' | 'C' | 'D') => void;
  onSubmitAnswer: () => void;
  onNextQuestionAndTeam: () => void;
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
  activeTeam,
  nextTeam,
  selectedOption,
  onSelectOption,
  onSubmitAnswer,
  onNextQuestionAndTeam,
  onSkipQuestion,
  hasWinner,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (!question) return null;

  const isLocked = lightState === 'RED';
  const isRevealed = phase === 'ANSWER_REVEAL';
  const isMoving = phase === 'MOVING_AVATARS';
  const isCorrect = isRevealed && selectedOption === question.correctAnswer;

  const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    Hard: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    Bonus: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  // Fixed, standard, natural order A, B, C, D — never shuffled, never reversed
  const standardOptions: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  // COLLAPSED BAR STATE
  if (isCollapsed) {
    return (
      <div className="pointer-events-auto h-full flex items-start pt-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-r-xl bg-slate-900/95 border-y border-r border-slate-700 text-white hover:bg-slate-800 transition-all shadow-xl group"
          title="Buka Panel Soalan"
        >
          <span className="text-xs font-black text-cyan-400 font-mono">Q{currentIndex + 1}</span>
          <span className="text-xs font-bold text-slate-300 group-hover:text-white">{activeTeam.name}</span>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-88 md:w-[460px] flex flex-col max-h-full pointer-events-auto transition-all duration-300 select-none">
      <div className="relative flex flex-col flex-1 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-3.5 md:p-4 text-white overflow-hidden">
        {/* Glow accent bar based on active team color */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500"
          style={{ backgroundColor: activeTeam.color }}
        />

        {/* TOP STATUS BAR: Question #, Difficulty, Collapse Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-xs text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Soalan {currentIndex + 1} / {totalQuestions}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                difficultyColors[question.difficulty]
              }`}
            >
              {question.difficulty === 'Bonus' && <Sparkles className="w-3 h-3" />}
              {question.difficulty} · +{question.movementSteps}{' '}
              {question.movementSteps === 1 ? 'Langkah' : 'Langkah'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Skip question */}
            <button
              onClick={onSkipQuestion}
              disabled={isMoving}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Langkau soalan ini"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Collapse button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Kecilkan panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ACTIVE TEAM SPOTLIGHT BANNER */}
        <div
          className="p-2.5 rounded-xl border flex items-center justify-between gap-2.5 mb-2.5 transition-all shadow-md"
          style={{
            backgroundColor: `${activeTeam.color}20`,
            borderColor: `${activeTeam.color}60`,
          }}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-slate-950 text-xs shadow-md shrink-0"
              style={{ backgroundColor: activeTeam.color }}
            >
              #{activeTeam.number}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-black text-sm text-white tracking-wide truncate">
                  GILIRAN {activeTeam.name.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">
                Jawab soalan di bawah untuk mara di trek!
              </div>
            </div>
          </div>

          <div
            className="px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 shadow-sm"
            style={{
              backgroundColor: activeTeam.color,
              color: '#0f172a',
            }}
          >
            SOALAN UNIK
          </div>
        </div>

        {/* Topic Tag if available */}
        {question.topic && (
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Topik: <span className="text-cyan-300">{question.topic}</span>
          </div>
        )}

        {/* QUESTION PROMPT (Clear & large on projector) */}
        <div className="mb-3">
          <h2
            className={`font-black leading-snug tracking-tight text-slate-100 ${
              isProjectorMode ? 'text-lg md:text-xl' : 'text-sm md:text-base'
            }`}
          >
            {question.question}
          </h2>
        </div>

        {/* 4 LARGE OPTION BUTTONS IN STRICT NATURAL ORDER: A, B, C, D */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
          {standardOptions.map(letter => {
            const text = question.options[letter];
            const isSelected = selectedOption === letter;
            const isCorrectAnswer = question.correctAnswer === letter;

            let cardStyle =
              'bg-slate-800/80 border-slate-700/80 text-slate-100 hover:border-slate-500 hover:bg-slate-800 active:scale-99';
            let badgeStyle = 'bg-slate-700 text-slate-200';

            if (isSelected && !isRevealed) {
              cardStyle = 'ring-2 shadow-lg';
              badgeStyle = 'font-black text-slate-950';
            }

            if (isRevealed) {
              if (isCorrectAnswer) {
                cardStyle = 'bg-emerald-950/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20';
                badgeStyle = 'bg-emerald-400 text-slate-950 font-black';
              } else if (isSelected && !isCorrectAnswer) {
                cardStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500';
                badgeStyle = 'bg-rose-500 text-white font-black';
              } else {
                cardStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-40';
                badgeStyle = 'bg-slate-800 text-slate-600';
              }
            }

            return (
              <button
                key={letter}
                type="button"
                disabled={isLocked || isRevealed || isMoving}
                onClick={() => onSelectOption(letter)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${cardStyle}`}
                style={
                  isSelected && !isRevealed
                    ? {
                        backgroundColor: `${activeTeam.color}25`,
                        borderColor: activeTeam.color,
                        boxShadow: `0 0 15px ${activeTeam.color}30`,
                      }
                    : undefined
                }
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-sm transition-colors ${badgeStyle}`}
                  style={
                    isSelected && !isRevealed
                      ? {
                          backgroundColor: activeTeam.color,
                          color: '#0f172a',
                        }
                      : undefined
                  }
                >
                  {letter}
                </div>
                <div className="font-bold text-xs md:text-sm flex-1 leading-tight">
                  {text}
                </div>
                {isRevealed && isCorrectAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                )}
                {isRevealed && isSelected && !isCorrectAnswer && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* IMMEDIATE RESULT BANNER FOR ACTIVE TEAM */}
        {isRevealed && (
          <div className="my-2.5">
            {isCorrect ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 flex items-center justify-between gap-2 shadow-lg shadow-emerald-500/10 animate-fadeIn">
                <div className="flex items-center gap-2.5 truncate">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                  <div className="truncate">
                    <span className="font-black text-sm text-white">JAWAPAN BETUL! MARA KE HADAPAN!</span>
                    <div className="text-[11px] text-emerald-300 font-semibold truncate">
                      {activeTeam.name} mara +{question.movementSteps} langkah di trek!
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs shrink-0 shadow-sm">
                  MARA +{question.movementSteps}M ➔
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-500/20 border-2 border-rose-400 text-rose-200 flex items-center justify-between gap-2 shadow-lg shadow-rose-500/10 animate-fadeIn">
                <div className="flex items-center gap-2.5 truncate">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-black text-sm text-white">JAWAPAN SALAH! KEKAL DI TEMPAT!</span>
                    <div className="text-[11px] text-rose-300 font-semibold truncate">
                      {activeTeam.name} STAY (0 langkah). Tiada pergerakan.
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-black text-xs shrink-0 shadow-sm">
                  STAY (0M)
                </span>
              </div>
            )}
          </div>
        )}

        {/* EDUCATIONAL EXPLANATION AFTER REVEAL */}
        {isRevealed && question.explanation && (
          <div className="mb-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 animate-fadeIn">
            <span className="font-bold text-emerald-400">💡 Penerangan: </span>
            <span>{question.explanation}</span>
          </div>
        )}

        {/* ACTION BUTTON AREA */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2">
          {/* While answering */}
          {!isRevealed && !isMoving && (
            <button
              onClick={onSubmitAnswer}
              disabled={!selectedOption || isLocked}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs md:text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                selectedOption && !isLocked
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/25 active:scale-98 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {selectedOption
                  ? `HANTAR JAWAPAN ${activeTeam.name.toUpperCase()} (PILIHAN ${selectedOption})`
                  : 'PILIH A, B, C, ATAU D'}
              </span>
            </button>
          )}

          {/* After reveal: Next question & next team */}
          {isRevealed && !hasWinner && (
            <button
              onClick={onNextQuestionAndTeam}
              className="w-full py-3 px-4 rounded-xl font-black text-xs md:text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 shadow-xl shadow-cyan-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 animate-pulse"
            >
              <span>SOALAN SETERUSNYA (GILIRAN {nextTeam.name.toUpperCase()})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* While avatars are sprinting */}
          {isMoving && !hasWinner && (
            <div className="w-full py-3 px-4 rounded-xl font-black text-xs md:text-sm bg-slate-800/90 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2 animate-pulse">
              <span>🏃 {activeTeam.name.toUpperCase()} SEDANG MARA DI TREK...</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
