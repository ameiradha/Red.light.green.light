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
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [teamAnswers, setTeamAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | null>>({});
  const [activeTeamId, setActiveTeamId] = useState<string | null>(teams[0]?.id || null);
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);

  // UI Modes
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);
  const [cameraPreset, setCameraPreset] = useState<'ABOVE' | 'OVERVIEW' | 'CHASE' | 'FINISH' | 'GUARDIAN'>('OVERVIEW');
  const [showSetupModal, setShowSetupModal] = useState<boolean>(true);
  const [showScoreboardModal, setShowScoreboardModal] = useState<boolean>(false);
  const [isArenaFocused, setIsArenaFocused] = useState<boolean>(false);

  // Red light freeze & start countdowns
  const [freezeCountdown, setFreezeCountdown] = useState<number | null>(null);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  // ---------------- 1. AUTHENTICATION & FIRESTORE CLOUD SYNC ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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

          // Per requirement: "Then after login, go to the teacher control page"
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

  // Current active question
  const currentQuestion = questions[currentIndex % questions.length] || null;

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
    setWinnerTeam(null);
    setTeamAnswers({});
    setLightState('GREEN');
    setPhase('QUESTION_ACTIVE');
    setTimerRemaining(null);
    sound.playGreenLight();
  }, []);

  // ---------------- REVEAL ANSWERS & ADVANCE AVATARS ----------------
  const handleRevealAnswer = useCallback(() => {
    if (!currentQuestion) return;

    const correctOpt = currentQuestion.correctAnswer.trim().toUpperCase();
    let anyCorrect = false;

    // Strict evaluation: Any team whose answer matches the correct answer moves forward!
    const evaluations = teams.map(team => {
      const answer = teamAnswers[team.id];
      const isCorrect = Boolean(answer && answer.trim().toUpperCase() === correctOpt);
      if (isCorrect) anyCorrect = true;

      let stepBonus = 0;
      let newStreak = team.streak;

      if (isCorrect) {
        newStreak = team.streak + 1;
        if (settings.enableStreakBonus) {
          if (newStreak >= 5) stepBonus += 3;
          else if (newStreak >= 3) stepBonus += 2;
          else if (newStreak >= 2) stepBonus += 1;
        }
      } else {
        if (team.powerCard?.id === 'safe_answer' && team.powerCard.used) {
          // Protected
        } else {
          newStreak = 0;
        }
      }

      const totalSteps = isCorrect ? (currentQuestion.movementSteps + stepBonus) : 0;
      const scoreGain = isCorrect ? (currentQuestion.points + stepBonus * 10) : 0;

      return {
        id: team.id,
        isCorrect,
        totalSteps,
        scoreGain,
        newStreak,
        answer: answer || null,
      };
    });

    // 1. Immediately switch phase to MOVING_AVATARS so running animation starts!
    setPhase('MOVING_AVATARS');
    if (anyCorrect) {
      sound.playCorrect();
      sound.playFootsteps();
    } else {
      sound.playWrong();
    }

    // 2. IMMEDIATELY update positions of the correct teams in state!
    setTeams(prevTeams =>
      prevTeams.map(team => {
        const ev = evaluations.find(e => e.id === team.id);
        if (!ev || !ev.isCorrect || ev.totalSteps <= 0) {
          return {
            ...team,
            lastAnswer: ev ? ev.answer : null,
            lastAnswerCorrect: false,
            lastStepDelta: 0,
            streak: 0,
          };
        }

        const newPos = Math.min(team.position + ev.totalSteps, settings.trackLength);
        return {
          ...team,
          position: newPos,
          score: team.score + ev.scoreGain,
          correctAnswers: team.correctAnswers + 1,
          streak: ev.newStreak,
          lastAnswer: ev.answer,
          lastAnswerCorrect: true,
          lastStepDelta: ev.totalSteps,
        };
      })
    );

    // 3. After 2.4 seconds of running, check for finish line winner or auto-advance directly to the next question
    setTimeout(() => {
      setTeams(currentTeams => {
        const champ = currentTeams.find(t => t.position >= settings.trackLength);
        if (champ) {
          setWinnerTeam(champ);
          setPhase('WINNER_CELEBRATION');
          sound.playVictory();
        } else {
          // Automatically advance directly to the next question!
          setCurrentIndex(prev => (prev + 1) % questions.length);
          setTeamAnswers({});
          setLightState('GREEN');
          setPhase('QUESTION_ACTIVE');
          sound.playGreenLight();
        }
        return currentTeams;
      });
    }, 2400);
  }, [currentQuestion, teamAnswers, settings, teams, questions.length]);

  // ---------------- SKIP / NEXT QUESTION ----------------
  const handleNextQuestion = useCallback(() => {
    if (winnerTeam) return;

    sound.playClick();
    setCurrentIndex(prev => (prev + 1) % questions.length);
    setTeamAnswers({});
    setLightState('GREEN');
    setPhase('QUESTION_ACTIVE');
    sound.playGreenLight();
  }, [winnerTeam, questions.length]);

  // ---------------- SKIP QUESTION ----------------
  const handleSkipQuestion = useCallback(() => {
    sound.playClick();
    setCurrentIndex(prev => (prev + 1) % questions.length);
    setTeamAnswers({});
    setLightState('GREEN');
    setPhase('QUESTION_ACTIVE');
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

  // ---------------- SELECT TEAM ANSWER ----------------
  const handleSelectTeamAnswer = useCallback(
    (teamId: string, answer: 'A' | 'B' | 'C' | 'D') => {
      if (lightState === 'RED' || phase === 'MOVING_AVATARS') {
        sound.playWrong();
        return;
      }
      sound.playClick();
      setTeamAnswers(prev => ({
        ...prev,
        [teamId]: prev[teamId] === answer ? null : answer,
      }));
    },
    [lightState, phase]
  );

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
        <p className="text-sm font-bold text-slate-300">Loading Red Light, Green Light Classroom...</p>
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
        {/* Play Teacher Panel Music on Login Screen */}
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
          <span>✕ EXIT FULL 3D VIEW</span>
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
        <main className="relative z-10 flex-1 flex flex-col justify-between p-3 md:p-5 pointer-events-none">
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

          {/* MIDDLE AREA: Left Question Panel & Right Teams Input Cards */}
          <div className="flex-1 flex items-center justify-between gap-4 my-2 overflow-hidden">
            {/* Left: Big Vertical Question Card */}
            <LeftQuestionPanel
              question={currentQuestion}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              phase={phase}
              lightState={lightState}
              timerRemaining={timerRemaining}
              timerDuration={settings.timerDuration}
              isProjectorMode={isProjectorMode}
              onSelectOptionForActiveTeam={
                activeTeamId
                  ? option => handleSelectTeamAnswer(activeTeamId, option)
                  : undefined
              }
              onRevealAnswer={handleRevealAnswer}
              onNextQuestion={handleNextQuestion}
              onSkipQuestion={handleSkipQuestion}
              activeTeam={teams.find(t => t.id === activeTeamId) || teams[0]}
              teams={teams}
              teamAnswers={teamAnswers}
              hasWinner={Boolean(winnerTeam)}
            />

            {/* Right: Interactive Team Cards & Answering Controls */}
            <RightTeamsPanel
              teams={teams}
              trackLength={settings.trackLength}
              activeTeamId={activeTeamId}
              onSelectActiveTeam={setActiveTeamId}
              teamAnswers={teamAnswers}
              onTeamAnswer={handleSelectTeamAnswer}
              onUsePowerCard={handleUsePowerCard}
              phase={phase}
              lightState={lightState}
              isProjectorMode={isProjectorMode}
              enablePowerCards={settings.enablePowerCards}
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
              onRevealAnswer={handleRevealAnswer}
              onNextQuestion={handleNextQuestion}
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
            />
          </footer>
        </main>
      )}

      {/* TEACHER SETUP MODAL (OPENS FIRST AFTER LOGIN & WHEN CLICKED) */}
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
              <h2 className="text-xl font-black text-white">Classroom Leaderboard</h2>
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

      {/* BACKGROUND MUSIC PLAYER (Plays https://youtu.be/q7uTnxYFDSw in Teacher Panel, https://youtu.be/7lkTqbH3WaI in Game) */}
      <BackgroundMusicPlayer
        isTeacherPanel={showSetupModal}
        isPaused={phase === 'PAUSED'}
        soundEnabled={soundEnabled}
        volume={40}
      />
    </div>
  );
}
