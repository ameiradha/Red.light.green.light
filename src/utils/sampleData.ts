import { Question, Team, GameSettings } from '../types/game';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-red',
    name: 'Team Red',
    number: 101,
    avatar: 'runner_boy',
    color: '#EF4444',
    secondaryColor: '#B91C1C',
    position: 0,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    powerCard: {
      id: 'double_move',
      name: 'Double Move',
      description: 'Next correct answer gives double movement steps',
      icon: '⚡',
      used: false,
    },
  },
  {
    id: 'team-blue',
    name: 'Team Blue',
    number: 202,
    avatar: 'runner_girl',
    color: '#3B82F6',
    secondaryColor: '#1D4ED8',
    position: 0,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    powerCard: {
      id: 'bonus_step',
      name: 'Bonus Step',
      description: 'Instantly grants +2 movement steps',
      icon: '🚀',
      used: false,
    },
  },
  {
    id: 'team-green',
    name: 'Team Green',
    number: 303,
    avatar: 'mascot_bear',
    color: '#10B981',
    secondaryColor: '#047857',
    position: 0,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    powerCard: {
      id: 'safe_answer',
      name: 'Safe Answer',
      description: 'Protects streak if team makes an incorrect guess',
      icon: '🛡️',
      used: false,
    },
  },
  {
    id: 'team-yellow',
    name: 'Team Yellow',
    number: 404,
    avatar: 'astronaut',
    color: '#F59E0B',
    secondaryColor: '#B45309',
    position: 0,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    powerCard: {
      id: 'second_chance',
      name: 'Second Chance',
      description: 'Provides a second chance retry if answer is incorrect',
      icon: '🔄',
      used: false,
    },
  },
];

export const EXTRA_AVATAR_TEMPLATES: Omit<Team, 'id' | 'position' | 'score' | 'correctAnswers' | 'wrongAnswers' | 'streak'>[] = [
  {
    name: 'Team Purple',
    number: 505,
    avatar: 'robot',
    color: '#A855F7',
    secondaryColor: '#7E22CE',
  },
  {
    name: 'Team Orange',
    number: 606,
    avatar: 'champion',
    color: '#F97316',
    secondaryColor: '#C2410C',
  },
  {
    name: 'Team Pink',
    number: 707,
    avatar: 'runner_girl',
    color: '#EC4899',
    secondaryColor: '#BE185D',
  },
  {
    name: 'Team Cyan',
    number: 808,
    avatar: 'astronaut',
    color: '#06B6D4',
    secondaryColor: '#0E7490',
  },
];

export const SCIENCE_HUMAN_BODY_QUESTIONS: Question[] = [
  {
    id: 'q1',
    question: 'Which organ pumps blood around the entire body?',
    options: {
      A: 'Brain',
      B: 'Heart',
      C: 'Lung',
      D: 'Stomach',
    },
    correctAnswer: 'B',
    difficulty: 'Easy',
    points: 10,
    movementSteps: 1,
    explanation: 'The heart is a muscular organ that beats continuously to circulate oxygen-rich blood throughout the body.',
    topic: 'Circulatory System',
  },
  {
    id: 'q2',
    question: 'Which organ is mainly used for breathing and exchanging gases?',
    options: {
      A: 'Heart',
      B: 'Stomach',
      C: 'Lungs',
      D: 'Brain',
    },
    correctAnswer: 'C',
    difficulty: 'Easy',
    points: 10,
    movementSteps: 1,
    explanation: 'Our pair of lungs inhale oxygen from the air and exhale carbon dioxide waste.',
    topic: 'Respiratory System',
  },
  {
    id: 'q3',
    question: 'Which vital organ controls our thoughts, memories, and body movement?',
    options: {
      A: 'Brain',
      B: 'Heart',
      C: 'Lung',
      D: 'Bone',
    },
    correctAnswer: 'A',
    difficulty: 'Easy',
    points: 10,
    movementSteps: 1,
    explanation: 'The brain acts as the central control computer of our nervous system.',
    topic: 'Nervous System',
  },
  {
    id: 'q4',
    question: 'What hard bone structure protects our delicate brain from injury?',
    options: {
      A: 'Ribcage',
      B: 'Pelvis',
      C: 'Skull',
      D: 'Spine',
    },
    correctAnswer: 'C',
    difficulty: 'Medium',
    points: 20,
    movementSteps: 2,
    explanation: 'The skull (cranium) forms a protective helmet of fused bones shielding the brain.',
    topic: 'Skeletal System',
  },
  {
    id: 'q5',
    question: 'Which organ churns food and produces digestive juices to break down meals?',
    options: {
      A: 'Stomach',
      B: 'Heart',
      C: 'Windpipe',
      D: 'Kidney',
    },
    correctAnswer: 'A',
    difficulty: 'Medium',
    points: 20,
    movementSteps: 2,
    explanation: 'The stomach breaks down food mechanically and chemically using gastric acids and enzymes.',
    topic: 'Digestive System',
  },
  {
    id: 'q6',
    question: 'What connects two bones together at flexible joints in the body?',
    options: {
      A: 'Skin',
      B: 'Ligaments',
      C: 'Hair',
      D: 'Nerves',
    },
    correctAnswer: 'B',
    difficulty: 'Hard',
    points: 30,
    movementSteps: 3,
    explanation: 'Ligaments are strong elastic bands of tissue that connect bone to bone at our joints.',
    topic: 'Musculoskeletal',
  },
  {
    id: 'q7',
    question: 'Which sense organ detects sound vibrations in the air around us?',
    options: {
      A: 'Tongue',
      B: 'Eyes',
      C: 'Ears',
      D: 'Nose',
    },
    correctAnswer: 'C',
    difficulty: 'Easy',
    points: 10,
    movementSteps: 1,
    explanation: 'Our ears collect sound waves and translate vibrations into neural signals sent to the brain.',
    topic: 'Sensory Organs',
  },
  {
    id: 'q8',
    question: 'How many permanent teeth does a typical adult human develop?',
    options: {
      A: '20',
      B: '28',
      C: '32',
      D: '40',
    },
    correctAnswer: 'C',
    difficulty: 'Medium',
    points: 20,
    movementSteps: 2,
    explanation: 'An adult human typically has 32 permanent teeth, including molars and wisdom teeth.',
    topic: 'Dentition',
  },
  {
    id: 'q9',
    question: 'Which blood vessels carry freshly oxygenated blood AWAY from the heart?',
    options: {
      A: 'Veins',
      B: 'Arteries',
      C: 'Capillaries',
      D: 'Valves',
    },
    correctAnswer: 'B',
    difficulty: 'Hard',
    points: 30,
    movementSteps: 3,
    explanation: 'Arteries carry blood away from the heart to all parts of the body under high pressure.',
    topic: 'Circulatory System',
  },
  {
    id: 'q10',
    question: 'Which body system provides structural support, protection, and allows locomotion with muscles?',
    options: {
      A: 'Skeletal System',
      B: 'Digestive System',
      C: 'Urinary System',
      D: 'Integumentary System',
    },
    correctAnswer: 'A',
    difficulty: 'Medium',
    points: 20,
    movementSteps: 2,
    explanation: 'The skeletal system consists of over 200 bones providing framework, marrow, and protection.',
    topic: 'Anatomy',
  },
  {
    id: 'q11',
    question: 'What essential gas do our red blood cells pick up when air fills the lungs?',
    options: {
      A: 'Helium',
      B: 'Carbon Dioxide',
      C: 'Nitrogen',
      D: 'Oxygen',
    },
    correctAnswer: 'D',
    difficulty: 'Easy',
    points: 10,
    movementSteps: 1,
    explanation: 'Oxygen (O2) binds to hemoglobin in red blood cells to fuel cells across the body.',
    topic: 'Respiration',
  },
  {
    id: 'q12',
    question: '★ BONUS QUESTION: Which bean-shaped organs filter liquid waste from our bloodstream to make urine?',
    options: {
      A: 'Lungs',
      B: 'Kidneys',
      C: 'Spleen',
      D: 'Pancreas',
    },
    correctAnswer: 'B',
    difficulty: 'Bonus',
    points: 50,
    movementSteps: 5,
    explanation: 'The kidneys continually filter blood, remove waste products, balance hydration, and create urine.',
    topic: 'Excretory System',
  },
];

export const MATH_PRESET_QUESTIONS: Question[] = [
  {
    id: 'm1',
    question: 'What is 15 + 28?',
    options: { A: '41', B: '43', C: '45', D: '33' },
    correctAnswer: 'B',
    difficulty: 'Easy',
    points: 10,
    movementSteps: 1,
    explanation: '15 + 28 = 43',
    topic: 'Addition',
  },
  {
    id: 'm2',
    question: 'How many sides does a regular hexagon have?',
    options: { A: '5', B: '6', C: '7', D: '8' },
    correctAnswer: 'B',
    difficulty: 'Easy',
    points: 10,
    movementSteps: 1,
    explanation: 'Hexa means six; a hexagon has 6 straight sides.',
    topic: 'Geometry',
  },
  {
    id: 'm3',
    question: 'What is 9 × 7?',
    options: { A: '54', B: '63', C: '72', D: '61' },
    correctAnswer: 'B',
    difficulty: 'Medium',
    points: 20,
    movementSteps: 2,
    explanation: '9 multiplied by 7 equals 63.',
    topic: 'Multiplication',
  },
  {
    id: 'm4',
    question: 'If a pizza has 8 slices and Sara eats 3, what fraction of the pizza remains?',
    options: { A: '3/8', B: '4/8', C: '5/8', D: '1/2' },
    correctAnswer: 'C',
    difficulty: 'Medium',
    points: 20,
    movementSteps: 2,
    explanation: '8 - 3 = 5 slices left, so 5/8 remains.',
    topic: 'Fractions',
  },
  {
    id: 'm5',
    question: '★ BONUS: What is the perimeter of a rectangle with length 12cm and width 8cm?',
    options: { A: '20 cm', B: '96 cm', C: '40 cm', D: '48 cm' },
    correctAnswer: 'C',
    difficulty: 'Bonus',
    points: 50,
    movementSteps: 5,
    explanation: 'Perimeter = 2 × (12 + 8) = 2 × 20 = 40 cm.',
    topic: 'Perimeter',
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  trackLength: 12,
  timerDuration: 20, // 20 seconds default
  answeringMode: 'ALL_TEAMS',
  enablePowerCards: true,
  enableStreakBonus: true,
  difficultyMovement: {
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Bonus: 5,
  },
  graphicsQuality: 'MEDIUM',
  soundEnabled: true,
};

/**
 * Bulk Question Import parser:
 * Parses text blocks like:
 * QUESTION:
 * What is 5 + 5?
 * A: 8
 * B: 10
 * C: 12
 * D: 15
 * ANSWER: B
 * DIFFICULTY: Easy
 */
export function parseBulkQuestions(rawText: string): Question[] {
  const blocks = rawText.split(/(?:^|\n)(?=QUESTION:)/i).map(b => b.trim()).filter(Boolean);
  const questions: Question[] = [];

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const questionMatch = block.match(/QUESTION:\s*([\s\S]*?)(?=(?:A:|A\.)|$)/i);
    const optAMatch = block.match(/(?:A:|A\.)\s*([\s\S]*?)(?=(?:B:|B\.)|$)/i);
    const optBMatch = block.match(/(?:B:|B\.)\s*([\s\S]*?)(?=(?:C:|C\.)|$)/i);
    const optCMatch = block.match(/(?:C:|C\.)\s*([\s\S]*?)(?=(?:D:|D\.)|$)/i);
    const optDMatch = block.match(/(?:D:|D\.)\s*([\s\S]*?)(?=(?:ANSWER:|DIFFICULTY:|EXPLANATION:|$))/i);
    const answerMatch = block.match(/ANSWER:\s*([A-D])/i);
    const diffMatch = block.match(/DIFFICULTY:\s*(Easy|Medium|Hard|Bonus)/i);
    const moveMatch = block.match(/(?:MOVEMENT|STEPS):\s*(\d+)/i);
    const explMatch = block.match(/EXPLANATION:\s*([\s\S]*?)$/i);

    if (questionMatch && optAMatch && optBMatch && optCMatch && optDMatch && answerMatch) {
      const qText = questionMatch[1].trim();
      const a = optAMatch[1].trim();
      const b = optBMatch[1].trim();
      const c = optCMatch[1].trim();
      const d = optDMatch[1].trim();
      const ans = answerMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
      const diff = (diffMatch ? diffMatch[1] : 'Easy') as Question['difficulty'];
      const steps = moveMatch ? parseInt(moveMatch[1], 10) : (diff === 'Easy' ? 1 : diff === 'Medium' ? 2 : diff === 'Hard' ? 3 : 5);
      const points = steps * 10;

      questions.push({
        id: `import-${Date.now()}-${idx}`,
        question: qText,
        options: { A: a, B: b, C: c, D: d },
        correctAnswer: ans,
        difficulty: diff,
        movementSteps: steps,
        points: points,
        explanation: explMatch ? explMatch[1].trim() : undefined,
      });
    }
  }

  return questions;
}
