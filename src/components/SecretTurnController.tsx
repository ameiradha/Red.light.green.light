import React, { useState, useEffect } from 'react';
import { Question, Team, SecretTurnStep, GamePhase, LightState } from '../types/game';
import { sound } from '../utils/sound';
import {
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Shield,
  Users,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface SecretTurnControllerProps {
  question: Question;
  teams: Team[];
  activeTurnIndex: number;
  onActiveTurnChange: (index: number) => void;
  teamAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  onLockTeamAnswer: (teamId: string, answer: 'A' | 'B' | 'C' | 'D') => void;
  turnStep: SecretTurnStep;
  onTurnStepChange: (step: SecretTurnStep) => void;
  onTriggerReveal: () => void;
  onRunAndAdvance: () => void;
  onNextQuestion: () => void;
  isLocked: boolean; // RED light
  isProjectorMode: boolean;
  hasWinner: boolean;
}

// Utility to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const SecretTurnController: React.FC<SecretTurnControllerProps> = ({
  question,
  teams,
  activeTurnIndex,
  onActiveTurnChange,
  teamAnswers,
  onLockTeamAnswer,
  turnStep,
  onTurnStepChange,
  onTriggerReveal,
  onRunAndAdvance,
  onNextQuestion,
  isLocked,
  isProjectorMode,
  hasWinner,
}) => {
  // Pending choice before confirmation
  const [pendingChoice, setPendingChoice] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Countdown number (3, 2, 1) during dramatic reveal countdown
  const [countdownNum, setCountdownNum] = useState<number>(3);

  // Per-team randomized option position mappings for this question
  // e.g. { 'team-1': ['C', 'A', 'D', 'B'], 'team-2': ['B', 'D', 'A', 'C'] }
  const [teamOptionOrders, setTeamOptionOrders] = useState<Record<string, ('A' | 'B' | 'C' | 'D')[]>>({});

  // Generate new randomized option orders whenever the question changes
  useEffect(() => {
    const initialOrders: Record<string, ('A' | 'B' | 'C' | 'D')[]> = {};
    teams.forEach(team => {
      initialOrders[team.id] = shuffleArray(['A', 'B', 'C', 'D'] as const);
    });
    setTeamOptionOrders(initialOrders);
    setPendingChoice(null);
  }, [question.id, teams]);

  const activeTeam = teams[activeTurnIndex] || teams[0];
  const isLastTeam = activeTurnIndex >= teams.length - 1;

  // Active team's randomized option order
  const currentTeamOrder = teamOptionOrders[activeTeam?.id] || ['A', 'B', 'C', 'D'];

  // Handle countdown effect
  useEffect(() => {
    if (turnStep !== 'REVEAL_COUNTDOWN') return;

    setCountdownNum(3);
    sound.playCountdownTick(false);

    const timer1 = setTimeout(() => {
      setCountdownNum(2);
      sound.playCountdownTick(false);
    }, 1000);

    const timer2 = setTimeout(() => {
      setCountdownNum(1);
      sound.playCountdownTick(true);
    }, 2000);

    const timer3 = setTimeout(() => {
      sound.playDrumroll();
      onTurnStepChange('REVEALED');
      onTriggerReveal();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [turnStep]);

  // ---------------- HANDLERS ----------------

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    if (isLocked) {
      sound.playRedLight();
      return;
    }
    sound.playClick();
    setPendingChoice(option);
    onTurnStepChange('CONFIRMING');
  };

  const handleConfirmAnswer = () => {
    if (!pendingChoice || !activeTeam) return;

    sound.playLock();
    // Lock answer internally
    onLockTeamAnswer(activeTeam.id, pendingChoice);

    // Check if this was the last team
    if (isLastTeam) {
      onTurnStepChange('ALL_LOCKED');
    } else {
      onTurnStepChange('LOCKED_PASS');
    }
    setPendingChoice(null);
  };

  const handleChangeAnswer = () => {
    sound.playClick();
    setPendingChoice(null);
    onTurnStepChange('SELECTING');
  };

  const handlePassToNextTeam = () => {
    sound.playClick();
    if (!isLastTeam) {
      onActiveTurnChange(activeTurnIndex + 1);
      setPendingChoice(null);
      onTurnStepChange('SELECTING');
    } else {
      onTurnStepChange('ALL_LOCKED');
    }
  };

  const handleStartRevealCountdown = () => {
    sound.playClick();
    onTurnStepChange('REVEAL_COUNTDOWN');
  };

  // ---------------- RENDER SUB-VIEWS ----------------

  // 1. DRAMATIC 3-2-1 REVEAL COUNTDOWN
  if (turnStep === 'REVEAL_COUNTDOWN') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-black uppercase tracking-widest mb-4">
          <Eye className="w-3.5 h-3.5 animate-pulse" />
          <span>REVEALING ALL TEAM ANSWERS</span>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/30 to-purple-500/20 border-2 border-cyan-400/50 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse">
            <span className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-400 font-mono scale-110 transition-transform">
              {countdownNum}
            </span>
          </div>
        </div>

        <p className="text-xs md:text-sm font-extrabold text-slate-300 mt-2 tracking-wide">
          Hold your breath... Simultaneous showdown!
        </p>
      </div>
    );
  }

  // 2. SIMULTANEOUS RESULTS & REVEAL VIEW
  if (turnStep === 'REVEALED') {
    const correctOptionLetter = question.correctAnswer;
    const correctOptionText = question.options[correctOptionLetter];

    return (
      <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 animate-fadeIn select-none">
        {/* CORRECT ANSWER CALLOUT BANNER */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400/80 shadow-lg shadow-emerald-500/20 mb-3 text-left">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>CORRECT ANSWER: OPTION {correctOptionLetter}</span>
          </div>
          <div className="text-sm md:text-base font-extrabold text-white leading-snug">
            {correctOptionText}
          </div>
          {question.explanation && (
            <div className="mt-2 pt-2 border-t border-emerald-800/60 text-xs text-emerald-200/90">
              <span className="font-bold text-emerald-300">💡 Explanation: </span>
              <span>{question.explanation}</span>
            </div>
          )}
        </div>

        {/* ALL TEAMS RESULT BREAKDOWN */}
        <div className="space-y-2 mb-3">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
            Team Submissions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {teams.map(team => {
              const ans = teamAnswers[team.id];
              const isCorrect = ans === correctOptionLetter;
              return (
                <div
                  key={team.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-md transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-100 ring-1 ring-emerald-400/40'
                      : 'bg-rose-950/70 border-rose-500/80 text-rose-100 ring-1 ring-rose-400/40'
                  }`}
                  style={{ borderLeft: `5px solid ${team.color}` }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <div className="truncate">
                      <div className="font-black text-xs text-white truncate">{team.name}</div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        Chose: <span className="font-bold">{ans || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+{question.movementSteps} Steps</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/30 text-rose-300 font-black text-xs border border-rose-500/50">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Wrong</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PRIMARY REVEAL ACTION BUTTON */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={onRunAndAdvance}
            className="w-full py-3 px-4 rounded-xl font-black text-xs md:text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 animate-pulse"
          >
            <span>🏃 RUN ON TRACK & ADVANCE</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. ALL TEAMS LOCKED SCREEN
  if (turnStep === 'ALL_LOCKED') {
    return (
      <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl animate-fadeIn select-none text-center">
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <Lock className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white mb-1">
            🔒 ALL ANSWERS LOCKED
          </h3>
          <p className="text-xs md:text-sm text-slate-300 max-w-sm mb-4 leading-relaxed">
            All <span className="text-cyan-400 font-bold">{teams.length} teams</span> have submitted their secret answers. No more changes allowed.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {teams.map(team => (
              <div
                key={team.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span>{team.name}</span>
                <span className="text-emerald-400">✓</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={handleStartRevealCountdown}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 shadow-xl shadow-cyan-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>REVEAL ANSWERS & SHOW RESULTS</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. LOCKED & PASS THE PAD SCREEN
  if (turnStep === 'LOCKED_PASS') {
    const nextTeam = teams[activeTurnIndex + 1];

    return (
      <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl animate-fadeIn select-none text-center">
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-black text-slate-200 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeTeam.color }}
            />
            <span>{activeTeam.name.toUpperCase()} SUBMITTED</span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white mb-2">
            🔒 ANSWER LOCKED SECURELY
          </h3>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 max-w-sm mb-4">
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              Answer is encrypted & hidden. Please pass the pad to{' '}
              <span className="font-extrabold text-white" style={{ color: nextTeam?.color }}>
                {nextTeam ? nextTeam.name : 'the next team'}
              </span>
              .
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={handlePassToNextTeam}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>NEXT TEAM ({nextTeam?.name || 'NEXT'}) ➔</span>
          </button>
        </div>
      </div>
    );
  }

  // 5. CONFIRMATION SCREEN (LOCK THIS ANSWER?)
  if (turnStep === 'CONFIRMING') {
    return (
      <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl animate-fadeIn select-none">
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-xl border-2"
            style={{
              backgroundColor: `${activeTeam.color}25`,
              borderColor: activeTeam.color,
            }}
          >
            <Lock className="w-7 h-7" style={{ color: activeTeam.color }} />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-black text-slate-200 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeTeam.color }}
            />
            <span>{activeTeam.name.toUpperCase()}</span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white mb-2">
            LOCK THIS ANSWER?
          </h3>

          <p className="text-xs text-slate-400 max-w-xs mb-6">
            Once confirmed, your answer will be locked and hidden immediately from all other teams.
          </p>

          <div className="w-full max-w-xs grid grid-cols-2 gap-3">
            <button
              onClick={handleChangeAnswer}
              className="py-3 px-4 rounded-xl font-extrabold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CHANGE</span>
            </button>

            <button
              onClick={handleConfirmAnswer}
              className="py-3 px-4 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CONFIRM</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. DEFAULT: SELECTING SCREEN (ACTIVE TEAM RANDOMIZED OPTION BUTTONS)
  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 animate-fadeIn select-none">
      {/* ACTIVE TEAM HEADER BANNER */}
      <div
        className="p-3 rounded-2xl border flex items-center justify-between gap-3 mb-3 shadow-lg"
        style={{
          backgroundColor: `${activeTeam.color}18`,
          borderColor: `${activeTeam.color}60`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow-md"
            style={{ backgroundColor: activeTeam.color }}
          >
            #{activeTeam.number}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-white">{activeTeam.name.toUpperCase()}</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase">
                YOUR TURN
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-semibold">
              Step {activeTurnIndex + 1} of {teams.length} · Tap your answer below
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono text-slate-400">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Secret Mode</span>
        </div>
      </div>

      {/* 4 LARGE TOUCH-FRIENDLY BUTTONS WITH RANDOMIZED POSITIONS */}
      <div className="space-y-2 flex-1">
        {currentTeamOrder.map(letter => {
          const text = question.options[letter];

          return (
            <button
              key={letter}
              type="button"
              disabled={isLocked}
              onClick={() => handleSelectOption(letter)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400 hover:bg-slate-800 text-left transition-all active:scale-98 shadow-md group cursor-pointer"
            >
              <div
                className="w-8 h-8 rounded-xl bg-slate-700 text-slate-100 group-hover:bg-cyan-400 group-hover:text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-colors"
              >
                {letter}
              </div>
              <div className="font-bold text-xs md:text-sm text-slate-100 flex-1 leading-tight group-hover:text-white">
                {text}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </div>

      {/* SECRET TURN ANTI-CHEATING FOOTER */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-cyan-400" />
          <span>Buttons randomized per team · Hidden until final reveal</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          Team {activeTurnIndex + 1}/{teams.length}
        </span>
      </div>
    </div>
  );
};
