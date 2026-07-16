import { api } from "./api";
import type { ChatHistoryItem, ChatMessageResponse } from "../types/learnings";

type SendChatMessagePayload = {
  message: string;
  topic_id?: number;
};

export const sendChatMessage = async (
  payload: SendChatMessagePayload,
): Promise<ChatMessageResponse> => {
  const response = await api.post("/chat/message", payload);
  return response.data;
};

export const getChatHistory = async (
  limit = 20,
): Promise<ChatHistoryItem[]> => {
  const response = await api.get("/chat/history", {
    params: {
      limit,
    },
  });

  return response.data;
};

export const clearChatHistory = async () => {
  const response = await api.delete("/chat/history");
  return response.data;
};
