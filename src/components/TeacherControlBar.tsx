import React from 'react';
import { GamePhase, LightState } from '../types/game';
import {
  Play,
  Pause,
  ChevronRight,
  Eye,
  Settings,
  Volume2,
  VolumeX,
  Tv,
  Camera,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  LogOut,
  Send,
} from 'lucide-react';

interface TeacherControlBarProps {
  phase: GamePhase;
  lightState: LightState;
  isProjectorMode: boolean;
  soundEnabled: boolean;
  cameraPreset: 'ABOVE' | 'OVERVIEW' | 'CHASE' | 'FINISH' | 'GUARDIAN';
  onTogglePlayPause: () => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
  onSkipQuestion: () => void;
  onToggleLight: () => void;
  onToggleProjectorMode: () => void;
  onToggleSound: () => void;
  onChangeCameraPreset: (preset: 'ABOVE' | 'OVERVIEW' | 'CHASE' | 'FINISH' | 'GUARDIAN') => void;
  onOpenSetup: () => void;
  onRestartGame: () => void;
  hasWinner: boolean;
  isArenaFocused?: boolean;
  onToggleArenaFocus?: () => void;
  user?: any;
  onLogout?: () => void;
  hasSelectedOption?: boolean;
}

export const TeacherControlBar: React.FC<TeacherControlBarProps> = ({
  phase,
  lightState,
  isProjectorMode,
  soundEnabled,
  cameraPreset,
  onTogglePlayPause,
  onRevealAnswer,
  onNextQuestion,
  onSkipQuestion,
  onToggleLight,
  onToggleProjectorMode,
  onToggleSound,
  onChangeCameraPreset,
  onOpenSetup,
  onRestartGame,
  hasWinner,
  isArenaFocused = false,
  onToggleArenaFocus,
  user,
  onLogout,
  hasSelectedOption = false,
}) => {
  const isGreen = lightState === 'GREEN';
  const isPaused = phase === 'PAUSED';
  const isQuestionActive = phase === 'QUESTION_ACTIVE';
  const isRevealed = phase === 'ANSWER_REVEAL';
  const isMoving = phase === 'MOVING_AVATARS';

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 md:px-4 py-2 shadow-2xl text-white select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Core Primary Classroom Actions */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={onTogglePlayPause}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              isPaused
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Jeda atau Sambung Permainan"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'SAMBUNG' : 'JEDA'}</span>
          </button>

          {/* Reveal / Submit answer button */}
          {isQuestionActive && (
            <button
              onClick={onRevealAnswer}
              disabled={!hasSelectedOption}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                hasSelectedOption
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>SEMAK JAWAPAN</span>
            </button>
          )}

          {/* Next question button */}
          {isRevealed && !hasWinner && (
            <button
              onClick={onNextQuestion}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-extrabold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition-all animate-pulse"
            >
              <span>SOALAN SETERUSNYA</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Moving status */}
          {isMoving && !hasWinner && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs bg-slate-800 border border-emerald-500/40 text-emerald-300 animate-pulse">
              <span>🏃 MARA DI TREK...</span>
            </div>
          )}

          {/* Skip question */}
          {isQuestionActive && (
            <button
              onClick={onSkipQuestion}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Langkau soalan ini"
            >
              <SkipForward className="w-3 h-3" />
              <span className="hidden sm:inline">LANGKAU</span>
            </button>
          )}

          {/* Full Arena View Toggle */}
          {onToggleArenaFocus && (
            <button
              onClick={onToggleArenaFocus}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                isArenaFocused
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md ring-1 ring-cyan-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Papar stadium 3D penuh tanpa halangan"
            >
              {isArenaFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">{isArenaFocused ? 'KELUAR 3D' : 'PANDANGAN 3D'}</span>
            </button>
          )}
        </div>

        {/* Center: Red Light / Green Light Traffic Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLight}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all border shadow-lg ${
              isGreen
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30'
                : 'bg-rose-500/20 border-rose-400 text-rose-300 ring-2 ring-rose-500/30'
            }`}
            title="Tukar Lampu Hijau / Merah"
          >
            <span
              className={`w-3 h-3 rounded-full animate-ping ${
                isGreen ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span>{isGreen ? '🟢 LAMPU HIJAU: AKTIF' : '🔴 LAMPU MERAH: BERHENTI!'}</span>
          </button>
        </div>

        {/* Right: Camera, Projector, Sound & Settings Controls */}
        <div className="flex items-center gap-1.5">
          {/* Camera View Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <Camera className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
            {(['ABOVE', 'OVERVIEW', 'CHASE', 'FINISH', 'GUARDIAN'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => onChangeCameraPreset(preset)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  cameraPreset === preset
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset === 'ABOVE' ? '🚁 ATAS' : preset}
              </button>
            ))}
          </div>

          {/* Projector Mode Toggle */}
          <button
            onClick={onToggleProjectorMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all border ${
              isProjectorMode
                ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Mod Projektor / Kontras Tinggi"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PROJEKTOR</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all"
            title={soundEnabled ? 'Matikan Bunyi' : 'Hidupkan Bunyi'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Reset / Restart */}
          <button
            onClick={onRestartGame}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all"
            title="Mula Semula Permainan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Teacher Setup / Questions Editor */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-xs font-black text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
            title="Buka Panel Guru & Editor Soalan"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PANEL GURU</span>
          </button>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Guru'} className="w-6 h-6 rounded-full border border-slate-700" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                  {user.displayName?.[0] || 'G'}
                </div>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 rounded-xl transition-all"
                  title="Log Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
