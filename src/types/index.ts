export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  slug?: string;
  description: string;
  content?: string;
  codeExamples?: CodeExample[];
  type?: string;
  xpReward: number;
  coinReward?: number;
  energyCost?: number;
  duration: string;
  completed?: boolean;
  isCompleted?: boolean;
}

export interface ModuleQuiz {
  id: string;
  title: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correct: number;
  }[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  isBossModule?: boolean;
  lessons: Lesson[];
  quiz?: ModuleQuiz;
  challenge?: Record<string, unknown>;
  miniProject?: Record<string, unknown>;
}

export interface Course {
  id: number | string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  category: string;
  difficulty: string;
  color: string;
  icon?: string;
  tags: string[];
  totalLessons: number;
  totalQuizzes?: number;
  totalChallenges?: number;
  estimatedHours?: number;
  xpReward: number;
  coinReward: number;
  modules: Module[];
}

export interface QuizQuestion {
  id?: string;
  type?: string;
  difficulty?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  lessonId?: string;
  courseId?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  xpReward: number;
  coinReward: number;
  timeLimit?: number | null;
}

export interface Challenge {
  id: number | string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  category: string;
  tags?: string[];
  solveCount?: number;
  attemptCount?: number;
  problemStatement: string;
  constraints: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode: Record<string, string>;
  hints: Array<{
    id: string;
    order: number;
    hintText: string;
    xpCost: number;
  }>;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    isExample?: boolean;
    explanation?: string;
  }>;
  xpReward: number;
  coinReward: number;
}

export interface Achievement {
  id: string;
  name?: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  requirement?: { type: string; count: number; metadata?: any };
  requirementType?: string;
  requirementCount?: number;
  xpReward: number;
  coinReward: number;
  isSecret: boolean;
}

export interface XPPopup {
  id: string;
  amount: number;
  type: 'xp' | 'coin' | 'streak' | 'achievement' | 'level';
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  xp: number;
  currentStreak: number;
}

export interface QuizQuestionData {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface BattleChallenge {
  id: string;
  title: string;
  description: string;
  code: string;
  bugDescription: string;
  xpReward: number;
}

export interface TypingSnippet {
  id: string;
  code: string;
  language: string;
  difficulty: string;
}

export interface BugSnippet {
  id: string;
  code: string;
  language: string;
  bugs: Array<{
    line: number;
    description: string;
    fix: string;
  }>;
}

export interface MemoryCard {
  id: string;
  concept: string;
  match: string;
  category: string;
}

export interface PredictionQuestion {
  id: string;
  code: string;
  language: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Aliases used in data files
export type CourseLesson = Lesson;
export type CourseModule = Module;

export interface FillBlankQuestion {
  id: string;
  code: string;
  language: string;
  blanks: Array<{
    position: number;
    answer: string;
    hint: string;
  }>;
  fullCode: string;
  explanation: string;
}
