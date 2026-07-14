import { api } from "./api";
import type {
  Exercise,
  PracticeStats,
  Submission,
  SubmissionResponse,
} from "../types/learnings";


type GenerateExercisePayload = {
  user_id: number;
  topic_id: number;
  language: string;
  difficulty: string;
};

type SubmitCodePayload = {
  user_id: number;
  topic_id: number;
  exercise: string;
  code: string;
  language: string;
};

export const generateExercise = async (
  payload: GenerateExercisePayload
): Promise<Exercise> => {
  const response = await api.post("/exercises/generate", payload);
  return response.data;
};

export const submitCodeForReview = async (
  payload: SubmitCodePayload
): Promise<SubmissionResponse> => {
  const response = await api.post("/exercises/submit-code", payload);
  return response.data;
};

export const getSubmissions = async (
  userId: number,
  topicId?: number
): Promise<Submission[]> => {
  const response = await api.get("/exercises/submissions", {
    params: {
      user_id: userId,
      topic_id: topicId,
    },
  });

  return response.data;
};

export const getPracticeStats = async (
  userId: number
): Promise<PracticeStats> => {
  const response = await api.get("/exercises/stats", {
    params: {
      user_id: userId,
    },
  });

  return response.data;
};