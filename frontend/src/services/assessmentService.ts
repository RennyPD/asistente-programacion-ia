import { api } from "./api";
import type {
  AssessmentData,
  AssessmentSubmitResponse,
} from "../types/learnings";

export const generateAssessment = async (
  topicId: number,
): Promise<AssessmentData> => {
  const response = await api.get(`/assessments/generate/${topicId}`);
  return response.data;
};

export const submitAssessment = async (
  topicId: number,
  answers: { question_id: number; selected_option: string }[],
): Promise<AssessmentSubmitResponse> => {
  const response = await api.post("/assessments/submit", {
    topic_id: topicId,
    answers,
  });

  return response.data;
};
