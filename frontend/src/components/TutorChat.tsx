import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Eraser,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  clearChatHistory,
  getChatHistory,
  sendChatMessage,
} from "../services/chatService";
import type { ChatHistoryItem } from "../types/learnings";
import MarkdownContent from "./MarkdownContent";

type TutorChatProps = {
  selectedTopicId?: number;
  selectedTopicTitle?: string;
};

const suggestedPrompts = [
  "Explícame este tema con un ejemplo sencillo",
  "Dame un error común y cómo evitarlo",
  "Hazme una pregunta para practicar",
  "¿Cómo aplico esto en un proyecto real?",
];

export default function TutorChat({
  selectedTopicId,
  selectedTopicTitle,
}: TutorChatProps) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getChatHistory(20);
      setHistory(data);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const result = await sendChatMessage({
        message: text,
        topic_id: selectedTopicId,
      });

      setHistory((currentHistory) => [...currentHistory, result.chat]);
      setMessage("");
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        "No se pudo enviar el mensaje al tutor IA.";

      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(message);
  };

  const handleClearHistory = async () => {
    await clearChatHistory();
    setHistory([]);
  };

  return (
    <section className="tutor-page">
      <div className="tutor-hero">
        <div>
          <span className="section-kicker">Tutor inteligente</span>
          <h2>Resuelve dudas con acompañamiento de IA</h2>
          <p>
            Haz preguntas sobre programación, errores, conceptos o ejercicios.
            El tutor usará como contexto el tema seleccionado.
          </p>
        </div>

        <div className="topic-context-card">
          <MessageSquareText size={20} />
          <div>
            <span>Tema actual</span>
            <strong>{selectedTopicTitle || "Sin tema seleccionado"}</strong>
          </div>
        </div>
      </div>

      <div className="tutor-layout">
        <aside className="tutor-side-panel">
          <div className="panel-title">
            <Sparkles size={18} />
            <h3>Preguntas sugeridas</h3>
          </div>

          <div className="prompt-list">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                className="prompt-chip"
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="practice-tip">
            <Sparkles size={17} />
            <p>
              Usa el tutor para entender, comparar ideas y recibir guía. Evita
              pedir solo la respuesta final.
            </p>
          </div>
        </aside>

        <section className="tutor-chat-card">
          <div className="tutor-chat-header">
            <div>
              <h3>Conversación</h3>
              <p>Historial guardado automáticamente para tu cuenta.</p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleClearHistory}
              disabled={history.length === 0}
            >
              <Eraser size={16} />
              Limpiar
            </button>
          </div>

          <div className="modern-chat-box">
            {loadingHistory && (
              <div className="empty-state">
                Cargando historial de conversación...
              </div>
            )}

            {!loadingHistory && history.length === 0 && (
              <div className="chat-empty-state">
                <Bot size={42} />
                <h3>Haz tu primera pregunta</h3>
                <p>
                  Ejemplo: “No entiendo cuándo usar for y cuándo usar while”.
                </p>
              </div>
            )}

            {history.map((item) => (
              <div key={item.id} className="modern-chat-group">
                <div className="modern-message user-modern-message">
                  <div className="message-avatar">
                    <UserRound size={18} />
                  </div>

                  <div className="message-bubble">
                    <strong>Tú</strong>
                    <p>{item.message}</p>
                  </div>
                </div>

                <div className="modern-message ai-modern-message">
                  <div className="message-avatar ai-avatar">
                    <Bot size={18} />
                  </div>

                  <div className="message-bubble">
                    <strong>Tutor IA</strong>
                    <MarkdownContent content={item.response} />
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="typing-indicator">
                <Loader2 size={18} />
                Tutor IA está respondiendo...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {errorMessage && <div className="auth-error">{errorMessage}</div>}

          <form onSubmit={handleSendMessage} className="modern-chat-form">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe tu duda sobre programación..."
              rows={3}
            />

            <button type="submit" disabled={loading || !message.trim()}>
              {loading ? <Loader2 size={16} /> : <Send size={16} />}
              Enviar
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
