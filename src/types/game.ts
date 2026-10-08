export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Bonus';

export type AvatarType = 'runner_boy' | 'runner_girl' | 'robot' | 'astronaut' | 'mascot_bear' | 'champion';

export type PowerCardType = 'double_move' | 'second_chance' | 'bonus_step' | 'safe_answer';

export interface PowerCard {
  id: PowerCardType;
  name: string;
  description: string;
  icon: string;
  used: boolean;
}

export interface Team {
  id: string;
  name: string;
  number: number;
  avatar: AvatarType;
  color: string;
  secondaryColor: string;
  position: number; // 0 to trackLength
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  streak: number;
  powerCard?: PowerCard;
  lastAnswer?: 'A' | 'B' | 'C' | 'D' | null;
  lastAnswerCorrect?: boolean | null;
  lastStepDelta?: number;
}

export interface Question {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: Difficulty;
  points: number; // Score points
  movementSteps: number; // Base steps forward
  explanation?: string;
  topic?: string;
  category?: string;
}

export type LightState = 'GREEN' | 'RED';

export type AnsweringMode = 'ALL_TEAMS' | 'TEACHER_SELECT';

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GameSettings {
  trackLength: number; // default 12
  timerDuration: number; // 0 = off, 10, 20, 30, 60
  answeringMode: AnsweringMode;
  enablePowerCards: boolean;
  enableStreakBonus: boolean;
  difficultyMovement: {
    Easy: number;
    Medium: number;
    Hard: number;
    Bonus: number;
  };
  graphicsQuality: GraphicsQuality;
  soundEnabled: boolean;
}

export type GamePhase = 
  | 'START_COUNTDOWN'
  | 'QUESTION_ACTIVE'
  | 'ANSWER_REVEAL'
  | 'MOVING_AVATARS'
  | 'WINNER_CELEBRATION'
  | 'PAUSED';


