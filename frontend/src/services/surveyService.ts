import { api } from "./api";
import type { SurveyPayload } from "../types/learnings";

export const submitSurvey = async (payload: SurveyPayload) => {
  const response = await api.post("/surveys/", payload);
  return response.data;
};
