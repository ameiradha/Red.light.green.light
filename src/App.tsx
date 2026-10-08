import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Team,
  Question,
  GameSettings,
  GamePhase,
  LightState,
} from './types/game';
import {
  INITIAL_TEAMS,
  SCIENCE_HUMAN_BODY_QUESTIONS,
  DEFAULT_SETTINGS,
} from './utils/sampleData';
import { sound } from './utils/sound';
import {
  auth,
  onAuthStateChanged,
  User,
  loadTeacherQuestions,
  saveTeacherQuestions,
  loadTeacherSettings,
  saveTeacherSettings,
  loadTeacherTeams,
  saveTeacherTeams,
  logoutTeacher,
} from './lib/firebase';
import { LoginPage } from './components/LoginPage';
import { ThreeCanvas } from './components/ThreeCanvas';
import { LeftQuestionPanel } from './components/LeftQuestionPanel';
import { RightTeamsPanel } from './components/RightTeamsPanel';
import { Scoreboard } from './components/Scoreboard';
import { TeacherControlBar } from './components/TeacherControlBar';
import { TeacherSetupModal } from './components/TeacherSetupModal';
import { WinnerModal } from './components/WinnerModal';
import { RedLightOverlay } from './components/RedLightOverlay';
import { BackgroundMusicPlayer } from './components/BackgroundMusicPlayer';
import { Loader2 } from 'lucide-react';

export default function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Teams, Questions, Settings
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [questions, setQuestions] = useState<Question[]>(SCIENCE_HUMAN_BODY_QUESTIONS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  // Game state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<GamePhase>('QUESTION_ACTIVE');
  const [lightState, setLightState] = useState<LightState>('GREEN');
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);

  // Team turns: Each team answers a DIFFERENT question sequentially
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // UI Modes
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);
  const [cameraPreset, setCameraPreset] = useState<'ABOVE' | 'OVERVIEW' | 'CHASE' | 'FINISH' | 'GUARDIAN'>('OVERVIEW');
  const [showSetupModal, setShowSetupModal] = useState<boolean>(true);
  const [showScoreboardModal, setShowScoreboardModal] = useState<boolean>(false);
  const [isArenaFocused, setIsArenaFocused] = useState<boolean>(false);

  // Red light freeze countdown
  const [freezeCountdown, setFreezeCountdown] = useState<number | null>(null);

  // ---------------- 1. AUTHENTICATION & FIRESTORE CLOUD SYNC ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);
      setIsAuthChecking(false);

      if (currentUser) {
        console.log('Logged in with Google account:', currentUser.email);
        try {
          // 1. Load questions stored under this Google account
          const storedQuestions = await loadTeacherQuestions(currentUser.uid);
          if (storedQuestions && storedQuestions.length > 0) {
            setQuestions(storedQuestions);
          } else {
            // First time login: seed default science questions to Firestore
            setQuestions(SCIENCE_HUMAN_BODY_QUESTIONS);
            await saveTeacherQuestions(currentUser.uid, SCIENCE_HUMAN_BODY_QUESTIONS);
          }

          // 2. Load stored settings & teams
          const storedSettings = await loadTeacherSettings(currentUser.uid);
          if (storedSettings) {
            setSettings(storedSettings);
            sound.setMuted(!storedSettings.soundEnabled);
            setSoundEnabled(storedSettings.soundEnabled);
          }

          const storedTeams = await loadTeacherTeams(currentUser.uid);
          if (storedTeams && storedTeams.length > 0) {
            setTeams(storedTeams);
          }

          setShowSetupModal(true);
        } catch (err) {
          console.error('Error fetching teacher data from Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync settings sound with sound helper
  useEffect(() => {
    sound.setMuted(!settings.soundEnabled);
    setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Current active question and active team
  const currentQuestion = questions[currentIndex % questions.length] || null;
  const activeTeam = teams[activeTurnIndex % teams.length] || teams[0];
  const nextTeam = teams[(activeTurnIndex + 1) % teams.length] || teams[0];

  // ---------------- RESET GAME STATE ----------------
  const handleResetGame = useCallback(() => {
    setTeams(prev =>
      prev.map(t => ({
        ...t,
        position: 0,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        streak: 0,
        lastAnswer: null,
        lastAnswerCorrect: null,
        powerCard: t.powerCard ? { ...t.powerCard, used: false } : undefined,
      }))
    );
    setCurrentIndex(0);
    setActiveTurnIndex(0);
    setSelectedOption(null);
    setWinnerTeam(null);
    setLightState('GREEN');
    setPhase('QUESTION_ACTIVE');
    sound.playGreenLight();
  }, []);

  // ---------------- SUBMIT & REVEAL ANSWER FOR ACTIVE TEAM ----------------
  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || !selectedOption || !activeTeam) return;

    const isAnswerCorrect = selectedOption.trim().toUpperCase() === currentQuestion.correctAnswer.trim().toUpperCase();

    let stepBonus = 0;
    let newStreak = activeTeam.streak;

    if (isAnswerCorrect) {
      newStreak = activeTeam.streak + 1;
      if (settings.enableStreakBonus) {
        if (newStreak >= 5) stepBonus += 3;
        else if (newStreak >= 3) stepBonus += 2;
        else if (newStreak >= 2) stepBonus += 1;
      }
      sound.playCorrect();
    } else {
      if (activeTeam.powerCard?.id === 'safe_answer' && activeTeam.powerCard.used) {
        // Protected by power card
      } else {
        newStreak = 0;
      }
      sound.playWrong();
    }

    const totalSteps = isAnswerCorrect ? (currentQuestion.movementSteps + stepBonus) : 0;
    const scoreGain = isAnswerCorrect ? (currentQuestion.points + stepBonus * 10) : 0;

    // Update active team's score, position, and streak
    setTeams(prevTeams =>
      prevTeams.map(t => {
        if (t.id === activeTeam.id) {
          const newPos = Math.min(t.position + totalSteps, settings.trackLength);
          return {
            ...t,
            position: newPos,
            score: t.score + scoreGain,
            correctAnswers: isAnswerCorrect ? t.correctAnswers + 1 : t.correctAnswers,
            wrongAnswers: !isAnswerCorrect ? t.wrongAnswers + 1 : t.wrongAnswers,
            streak: newStreak,
            lastAnswer: selectedOption,
            lastAnswerCorrect: isAnswerCorrect,
            lastStepDelta: totalSteps,
          };
        }
        return t;
      })
    );

    if (isAnswerCorrect && totalSteps > 0) {
      // Animate avatar movement
      setPhase('MOVING_AVATARS');
      sound.playFootsteps();

      setTimeout(() => {
        setTeams(currentTeams => {
          const updatedActive = currentTeams.find(t => t.id === activeTeam.id);
          if (updatedActive && updatedActive.position >= settings.trackLength) {
            setWinnerTeam(updatedActive);
            setPhase('WINNER_CELEBRATION');
            sound.playVictory();
          } else {
            setPhase('ANSWER_REVEAL');
          }
          return currentTeams;
        });
      }, 2200);
    } else {
      setPhase('ANSWER_REVEAL');
    }
  }, [currentQuestion, selectedOption, activeTeam, settings]);

  // ---------------- ADVANCE TO NEXT QUESTION & NEXT TEAM ----------------
  // Each team answers a different question from the 50-question pool!
  const handleNextQuestionAndTeam = useCallback(() => {
    if (winnerTeam) return;

    sound.playClick();
    // Advance to next unique question
    setCurrentIndex(prev => (prev + 1) % questions.length);
    // Advance to next team
    setActiveTurnIndex(prev => (prev + 1) % teams.length);
    // Reset selection for new question
    setSelectedOption(null);
    setPhase('QUESTION_ACTIVE');
    setLightState('GREEN');
    sound.playGreenLight();
  }, [winnerTeam, questions.length, teams.length]);

  // ---------------- SKIP QUESTION ----------------
  const handleSkipQuestion = useCallback(() => {
    sound.playClick();
    setCurrentIndex(prev => (prev + 1) % questions.length);
    setSelectedOption(null);
    setPhase('QUESTION_ACTIVE');
    setLightState('GREEN');
    sound.playGreenLight();
  }, [questions.length]);

  // ---------------- TOGGLE RED / GREEN LIGHT ----------------
  const handleToggleLight = useCallback(() => {
    if (lightState === 'GREEN') {
      sound.playRedLight();
      setLightState('RED');
      setFreezeCountdown(3);
      const freezeInterval = setInterval(() => {
        setFreezeCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(freezeInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      sound.playGreenLight();
      setLightState('GREEN');
      setFreezeCountdown(null);
    }
  }, [lightState]);

  // ---------------- USE POWER CARD ----------------
  const handleUsePowerCard = useCallback((teamId: string) => {
    sound.playStreakBonus();
    setTeams(prev =>
      prev.map(t => {
        if (t.id === teamId && t.powerCard && !t.powerCard.used) {
          return {
            ...t,
            powerCard: { ...t.powerCard, used: true },
          };
        }
        return t;
      })
    );
  }, []);

  // ---------------- SAVE HANDLERS WITH CLOUD SYNC ----------------
  const handleSaveQuestionsWithCloud = useCallback((newQuestions: Question[]) => {
    setQuestions(newQuestions);
    if (user) {
      saveTeacherQuestions(user.uid, newQuestions).catch(err => {
        console.error('Failed to sync questions to Firestore:', err);
      });
    }
  }, [user]);

  const handleSaveSettingsWithCloud = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    if (user) {
      saveTeacherSettings(user.uid, newSettings).catch(err => {
        console.error('Failed to sync settings to Firestore:', err);
      });
    }
  }, [user]);

  const handleSaveTeamsWithCloud = useCallback((newTeams: Team[]) => {
    setTeams(newTeams);
    if (user) {
      saveTeacherTeams(user.uid, newTeams).catch(err => {
        console.error('Failed to sync teams to Firestore:', err);
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logoutTeacher();
    setUser(null);
    setShowSetupModal(false);
  };

  // ---------------- AUTH LOADING SPLASH ----------------
  if (isAuthChecking) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-300">Memuatkan Permainan Lampu Merah, Lampu Hijau...</p>
      </div>
    );
  }

  // ---------------- LOGIN PAGE (FIRST PAGE) ----------------
  if (!user) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setShowSetupModal(true);
          }}
        />
        <BackgroundMusicPlayer
          isTeacherPanel={true}
          isPaused={false}
          soundEnabled={soundEnabled}
          volume={40}
        />
      </>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col">
      {/* 3D WEBGL ARENA CANVAS */}
      <div className="absolute inset-0 z-0">
        <ThreeCanvas
          teams={teams}
          trackLength={settings.trackLength}
          lightState={lightState}
          isMoving={phase === 'MOVING_AVATARS'}
          winnerTeam={winnerTeam}
          cameraPreset={cameraPreset}
          graphicsQuality={settings.graphicsQuality}
        />
      </div>

      {/* FULL ARENA MODE EXIT BUTTON */}
      {isArenaFocused && (
        <button
          onClick={() => setIsArenaFocused(false)}
          className="absolute top-4 right-4 z-40 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-400 text-cyan-300 text-xs font-black shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <span>✕ KELUAR PANDANGAN 3D</span>
        </button>
      )}

      {/* OVERLAY: RED LIGHT FREEZE WARNING */}
      {!isArenaFocused && (
        <RedLightOverlay
          lightState={lightState}
          showFreezeAlert={lightState === 'RED'}
          freezeCountdown={freezeCountdown}
        />
      )}

      {/* MAIN HEADS-UP DISPLAY (HUD) */}
      {!isArenaFocused && (
        <main className="relative z-10 flex-1 flex flex-col justify-between p-2.5 md:p-4 pointer-events-none overflow-hidden">
          {/* TOP BAR: Scoreboard / Contestant Avatars */}
          <header className="w-full flex items-start justify-between gap-3">
            <div className="pointer-events-auto">
              <Scoreboard
                teams={teams}
                trackLength={settings.trackLength}
                isProjectorMode={isProjectorMode}
              />
            </div>
          </header>

          {/* MIDDLE AREA: Left Question Panel & Right Teams Status Cards */}
          <div className="flex-1 flex items-stretch justify-between gap-3 md:gap-4 my-1.5 overflow-hidden">
            {/* Left: Direct Question Panel with Fixed A, B, C, D order for Active Team */}
            <LeftQuestionPanel
              question={currentQuestion}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              phase={phase}
              lightState={lightState}
              isProjectorMode={isProjectorMode}
              activeTeam={activeTeam}
              nextTeam={nextTeam}
              selectedOption={selectedOption}
              onSelectOption={setSelectedOption}
              onSubmitAnswer={handleSubmitAnswer}
              onNextQuestionAndTeam={handleNextQuestionAndTeam}
              onSkipQuestion={handleSkipQuestion}
              hasWinner={Boolean(winnerTeam)}
            />

            {/* Right: Team Progress & Status Panel */}
            <RightTeamsPanel
              teams={teams}
              trackLength={settings.trackLength}
              activeTurnIndex={activeTurnIndex}
              onSelectActiveTeam={(idx) => {
                setActiveTurnIndex(idx);
                setSelectedOption(null);
                setPhase('QUESTION_ACTIVE');
              }}
              phase={phase}
              lightState={lightState}
              isProjectorMode={isProjectorMode}
              enablePowerCards={settings.enablePowerCards}
              onUsePowerCard={handleUsePowerCard}
            />
          </div>

          {/* BOTTOM BAR: Teacher Control Console */}
          <footer className="w-full pointer-events-auto">
            <TeacherControlBar
              phase={phase}
              lightState={lightState}
              isProjectorMode={isProjectorMode}
              soundEnabled={soundEnabled}
              cameraPreset={cameraPreset}
              onTogglePlayPause={() => {
                sound.playClick();
                setPhase(prev => (prev === 'PAUSED' ? 'QUESTION_ACTIVE' : 'PAUSED'));
              }}
              onRevealAnswer={phase === 'ANSWER_REVEAL' ? handleNextQuestionAndTeam : handleSubmitAnswer}
              onNextQuestion={handleNextQuestionAndTeam}
              onSkipQuestion={handleSkipQuestion}
              onToggleLight={handleToggleLight}
              onToggleProjectorMode={() => {
                sound.playClick();
                setIsProjectorMode(prev => !prev);
              }}
              onToggleSound={() => {
                setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
              }}
              onChangeCameraPreset={preset => {
                sound.playClick();
                setCameraPreset(preset);
              }}
              onOpenSetup={() => {
                sound.playClick();
                setShowSetupModal(true);
              }}
              onRestartGame={() => {
                sound.playClick();
                handleResetGame();
              }}
              hasWinner={Boolean(winnerTeam)}
              isArenaFocused={isArenaFocused}
              onToggleArenaFocus={() => setIsArenaFocused(prev => !prev)}
              user={user}
              onLogout={handleLogout}
              hasSelectedOption={Boolean(selectedOption)}
            />
          </footer>
        </main>
      )}

      {/* TEACHER SETUP MODAL */}
      <TeacherSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        teams={teams}
        onSaveTeams={handleSaveTeamsWithCloud}
        questions={questions}
        onSaveQuestions={handleSaveQuestionsWithCloud}
        settings={settings}
        onSaveSettings={handleSaveSettingsWithCloud}
        onStartOrRestartGame={() => {
          handleResetGame();
          setShowSetupModal(false);
        }}
        user={user}
        onLogout={handleLogout}
      />

      {/* WINNER CELEBRATION MODAL */}
      {winnerTeam && (
        <WinnerModal
          winner={winnerTeam}
          teams={teams}
          trackLength={settings.trackLength}
          totalQuestionsAsked={currentIndex + 1}
          onPlayAgain={() => {
            sound.playClick();
            handleResetGame();
          }}
          onNewGame={() => {
            sound.playClick();
            handleResetGame();
            setShowSetupModal(true);
          }}
        />
      )}

      {/* FULL SCOREBOARD MODAL POPUP */}
      {showScoreboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-xl font-black text-white">Kedudukan Markah Kelas</h2>
              <button
                onClick={() => setShowScoreboardModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <Scoreboard
              teams={teams}
              trackLength={settings.trackLength}
              isProjectorMode={false}
            />
          </div>
        </div>
      )}

      {/* BACKGROUND MUSIC PLAYER */}
      <BackgroundMusicPlayer
        isTeacherPanel={showSetupModal}
        isPaused={phase === 'PAUSED'}
        soundEnabled={soundEnabled}
        volume={40}
      />
    </div>
  );
}
