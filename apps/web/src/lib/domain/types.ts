export type UserRole = "student" | "parent" | "admin";
export type PaperStatus = "draft" | "review" | "published" | "archived";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "multiple-choice" | "number";

export interface PaperSummary {
  id: string;
  title: string;
  grade: number;
  subject: string;
  subjectId: string;
  academicYear: string;
  questionCount: number;
  pageCount: number;
  durationMinutes: number;
  difficulty: Difficulty;
  access: "free" | "member" | "purchase";
  price?: number;
  status: PaperStatus;
}

export interface PracticeQuestion {
  id: string;
  sourceNumber?: number;
  prompt: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  imagePath?: string;
  stimulusPath?: string;
  answerValidator?: {
    kind: "number-range";
    greaterThan: number;
    lessThan: number;
  };
  explanation: string;
}
