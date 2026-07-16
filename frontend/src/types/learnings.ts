export type LearningPath = {
  id: number;
  title: string;
  description: string;
  level: string;
  language: string;
  created_at: string;
};

export type Topic = {
  id: number;
  learning_path_id: number;
  title: string;
  description: string;
  objective: string;
  order_number: number;
  created_at: string;
};

export type ProgressSummary = {
  total_topics: number;
  completed_topics: number;
  percentage: number;
  completed_topic_ids: number[];
};

export type Exercise = {
  id: number;
  user_id: number;
  topic_id: number;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  expected_solution?: string | null;
  created_by_ai: boolean;
  created_at: string;
};

export type SubmissionResponse = {
  message: string;
  feedback: string;
  score?: number | null;
};

export type Submission = {
  id: number;
  user_id: number;
  topic_id: number;
  exercise: string;
  code: string;
  ai_feedback: string;
  score?: number | null;
  created_at: string;
};

export type PracticeStats = {
  total_submissions: number;
  average_score: number;
  best_score: number;
  topics_practiced: number;
  last_submission_at?: string | null;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type ChatHistoryItem = {
  id: number;
  user_id: number;
  message: string;
  response: string;
  created_at: string;
};

export type ChatMessageResponse = {
  response: string;
  chat: ChatHistoryItem;
};

export type AssessmentQuestion = {
  id: number;
  question: string;
  options: Record<string, string>;
};

export type AssessmentData = {
  topic_id: number;
  topic_title: string;
  questions: AssessmentQuestion[];
};

export type AssessmentResultDetail = {
  question_id: number;
  question: string;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  explanation: string;
};

export type AssessmentSubmitResponse = {
  message: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  feedback: string;
  results: AssessmentResultDetail[];
};

export type SurveyPayload = {
  usefulness: number;
  ease_of_use: number;
  ai_support: number;
  recommendation: number;
  favorite_feature: string;
  comments?: string;
};
