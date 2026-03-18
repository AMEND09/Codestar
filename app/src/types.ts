export type QuestionType = 'multiple_choice' | 'fill_in';

export interface LessonQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  code?: string[];
  choices?: string[];
  answerIndex?: number;
  answerText?: string;
  explanation: string;
  concept?: string;
}

export interface Lesson {
  id: string;
  title: string;
  focus: string;
  xp: number;
  mascot: string;
  questions: LessonQuestion[];
}

export interface Unit {
  id: string;
  title: string;
  tagline: string;
  xp: number;
  status: 'unlocked' | 'locked';
  lessons: Lesson[];
}

export interface Character {
  id: string;
  glyph: string;
  name: string;
  mood: string;
  color: string;
  accent: string;
  role: string;
}

export interface PlacementQuestion extends LessonQuestion {
  weight: number;
}

export interface PlacementLevel {
  minScore: number;
  unitId: string;
  label: string;
}

export interface Placement {
  lead: string;
  questions: PlacementQuestion[];
  scoring: PlacementLevel[];
}

export interface CourseData {
  title: string;
  tagline: string;
  xpTotal: number;
  streakGoal: number;
  characters: Character[];
  placement: Placement;
  units: Unit[];
}
