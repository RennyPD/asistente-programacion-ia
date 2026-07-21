import { api } from "./api";
import type { LearningPath, ProgressSummary, Topic } from "../types/learnings";

export const getLearningPaths = async (): Promise<LearningPath[]> => {
  const response = await api.get("/learning-paths/");
  return response.data;
};

export const getLearningPathDetail = async (
  learningPathId: number,
): Promise<{ learning_path: LearningPath; topics: Topic[] }> => {
  const response = await api.get(`/learning-paths/${learningPathId}`);
  return response.data;
};

export const getProgressSummary = async (
  userId: number,
  learningPathId: number,
): Promise<ProgressSummary> => {
  const response = await api.get("/progress/summary", {
    params: {
      user_id: userId,
      learning_path_id: learningPathId,
    },
  });

  return response.data;
};

export const completeTopic = async (userId: number, topicId: number) => {
  const response = await api.post("/progress/complete-topic", {
    user_id: userId,
    topic_id: topicId,
  });

  return response.data;
};
