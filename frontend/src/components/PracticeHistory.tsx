import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarClock,
  Code2,
  Filter,
  Medal,
  TrendingUp,
} from "lucide-react";
import { getPracticeStats, getSubmissions } from "../services/exerciseService";
import type { PracticeStats, Submission } from "../types/learnings";
import MarkdownContent from "./MarkdownContent";

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

  const scores = submissions
    .map((submission) => submission.score)
    .filter((score): score is number => score !== null && score !== undefined)
    .slice(0, 8)
    .reverse();

  return (
    <section className="history-page">
      <div className="history-hero">
        <div>
          <span className="section-kicker">Historial y analíticas</span>
          <h2>Revisa tu progreso práctico</h2>
          <p>
            Consulta tus envíos, puntuaciones, retroalimentaciones y evolución
            dentro de la plataforma.
          </p>
        </div>

        <button
          className="secondary-button"
          disabled={!selectedTopicId}
          onClick={() => setShowOnlySelectedTopic(!showOnlySelectedTopic)}
        >
          <Filter size={16} />
          {showOnlySelectedTopic ? "Ver todo" : "Filtrar tema actual"}
        </button>
      </div>

      {stats && (
        <div className="analytics-grid">
          <div className="analytics-card">
            <Code2 size={22} />
            <span>{stats.total_submissions}</span>
            <p>Ejercicios enviados</p>
          </div>

          <div className="analytics-card">
            <BarChart3 size={22} />
            <span>{stats.average_score}/100</span>
            <p>Promedio general</p>
          </div>

          <div className="analytics-card">
            <Medal size={22} />
            <span>{stats.best_score}/100</span>
            <p>Mejor puntuación</p>
          </div>

          <div className="analytics-card">
            <Activity size={22} />
            <span>{stats.topics_practiced}</span>
            <p>Temas practicados</p>
          </div>
        </div>
      )}

      <div className="history-layout">
        <section className="history-chart-card">
          <div className="panel-title">
            <TrendingUp size={18} />
            <h3>Tendencia de puntuaciones</h3>
          </div>

          {scores.length === 0 ? (
            <div className="empty-state">
              Aún no hay puntuaciones suficientes para mostrar tendencia.
            </div>
          ) : (
            <div className="score-bars">
              {scores.map((score, index) => (
                <div key={`${score}-${index}`} className="score-bar-item">
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ height: `${score}%` }}
                    />
                  </div>
                  <span>{score}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="history-list-card">
          <div className="panel-title">
            <CalendarClock size={18} />
            <h3>Actividad reciente</h3>
          </div>

          {loading && <div className="empty-state">Cargando historial...</div>}

          {!loading && submissions.length === 0 && (
            <div className="empty-state">
              Todavía no hay prácticas guardadas.
            </div>
          )}

          <div className="modern-history-list">
            {submissions.map((submission) => (
              <article key={submission.id} className="modern-history-item">
                <div className="modern-history-header">
                  <div>
                    <strong>Práctica #{submission.id}</strong>
                    <p>{new Date(submission.created_at).toLocaleString()}</p>
                  </div>

                  {submission.score !== null &&
                    submission.score !== undefined && (
                      <span className="history-score">
                        {submission.score}/100
                      </span>
                    )}
                </div>

                <details className="history-details">
                  <summary>Ver ejercicio, código y retroalimentación</summary>

                  <div className="history-detail-grid">
                    <div>
                      <h4>Ejercicio</h4>
                      <div className="history-text">
                        <MarkdownContent content={submission.exercise} />
                      </div>
                    </div>

                    <div>
                      <h4>Código enviado</h4>
                      <pre className="history-code">
                        <code>{submission.code}</code>
                      </pre>
                    </div>

                    <div>
                      <h4>Retroalimentación</h4>
                      <div className="history-text">
                        <MarkdownContent content={submission.ai_feedback} />
                      </div>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
