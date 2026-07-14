import { useEffect, useState } from "react";
import {
  getPracticeStats,
  getSubmissions,
} from "../services/exerciseService";
import type { PracticeStats, Submission } from "../types/learning";

type PracticeHistoryProps = {
  userId: number;
  selectedTopicId?: number;
  refreshKey: number;
};

export default function PracticeHistory({
  userId,
  selectedTopicId,
  refreshKey,
}: PracticeHistoryProps) {
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showOnlySelectedTopic, setShowOnlySelectedTopic] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [userId, selectedTopicId, refreshKey, showOnlySelectedTopic]);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const topicFilter = showOnlySelectedTopic ? selectedTopicId : undefined;

      const [statsData, submissionsData] = await Promise.all([
        getPracticeStats(userId),
        getSubmissions(userId, topicFilter),
      ]);

      setStats(statsData);
      setSubmissions(submissionsData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Historial de prácticas</h2>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total_submissions}</span>
            <span className="stat-label">Ejercicios enviados</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">{stats.average_score}/100</span>
            <span className="stat-label">Promedio</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">{stats.best_score}/100</span>
            <span className="stat-label">Mejor puntuación</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">{stats.topics_practiced}</span>
            <span className="stat-label">Temas practicados</span>
          </div>
        </div>
      )}

      <button
        disabled={!selectedTopicId}
        onClick={() => setShowOnlySelectedTopic(!showOnlySelectedTopic)}
      >
        {showOnlySelectedTopic
          ? "Ver historial completo"
          : "Ver solo el tema seleccionado"}
      </button>

      {loading && <p>Cargando historial...</p>}

      {!loading && submissions.length === 0 && (
        <p>Todavía no hay prácticas guardadas.</p>
      )}

      <div className="history-list">
        {submissions.map((submission) => (
          <article key={submission.id} className="history-item">
            <div className="history-header">
              <strong>Práctica #{submission.id}</strong>

              {submission.score !== null && submission.score !== undefined && (
                <span className="history-score">
                  {submission.score}/100
                </span>
              )}
            </div>

            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(submission.created_at).toLocaleString()}
            </p>

            <p>
              <strong>Ejercicio:</strong>
            </p>

            <div className="history-text">
              {submission.exercise}
            </div>

            <p>
              <strong>Código enviado:</strong>
            </p>

            <pre className="history-code">
              <code>{submission.code}</code>
            </pre>

            <p>
              <strong>Retroalimentación:</strong>
            </p>

            <div className="history-text">
              {submission.ai_feedback}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}