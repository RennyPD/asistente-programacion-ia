import {
  BookOpen,
  CheckCircle2,
  Code2,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import type { Exercise, Topic } from "../types/learnings";
import MarkdownContent from "./MarkdownContent";

type PracticeWorkspaceProps = {
  selectedTopic: Topic;
  language: string;
  conceptAnswer: string;
  generatedExercise: Exercise | null;
  code: string;
  feedback: string;
  score?: number | null;
  loadingConcept: boolean;
  loadingExercise: boolean;
  loadingReview: boolean;
  onExplainConcept: () => void;
  onGenerateExercise: () => void;
  onCodeChange: (value: string) => void;
  onSubmitCode: () => void;
  onResetPractice: () => void;
};

export default function PracticeWorkspace({
  selectedTopic,
  language,
  conceptAnswer,
  generatedExercise,
  code,
  feedback,
  score,
  loadingConcept,
  loadingExercise,
  loadingReview,
  onExplainConcept,
  onGenerateExercise,
  onCodeChange,
  onSubmitCode,
  onResetPractice,
}: PracticeWorkspaceProps) {
  return (
    <section className="practice-page">
      <div className="practice-header">
        <div>
          <span className="section-kicker">Práctica asistida por IA</span>
          <h2>Practica programación con retroalimentación inteligente</h2>
          <p>
            Tema actual: <strong>{selectedTopic.title}</strong> · Lenguaje:{" "}
            <strong>{language}</strong>
          </p>
        </div>

        <div className="practice-header-actions">
          <button className="secondary-button" onClick={onResetPractice}>
            <RotateCcw size={16} />
            Reiniciar
          </button>

          <button onClick={onGenerateExercise} disabled={loadingExercise}>
            {loadingExercise ? <Loader2 size={16} /> : <Sparkles size={16} />}
            {loadingExercise ? "Generando..." : "Generar ejercicio"}
          </button>
        </div>
      </div>

      <div className="practice-layout">
        <aside className="practice-panel concept-panel">
          <div className="panel-title">
            <BookOpen size={18} />
            <h3>Explicación del concepto</h3>
          </div>

          <p className="topic-description">{selectedTopic.description}</p>

          <div className="objective-box">
            <Lightbulb size={18} />
            <div>
              <strong>Objetivo del tema</strong>
              <p>{selectedTopic.objective}</p>
            </div>
          </div>

          <button
            className="secondary-button full-button"
            onClick={onExplainConcept}
            disabled={loadingConcept}
          >
            {loadingConcept ? "Consultando..." : "Explicar con IA"}
          </button>

          {conceptAnswer ? (
            <details className="ai-details" open>
              <summary>Ver explicación del concepto</summary>
              <div className="concept-answer">
                <MarkdownContent content={conceptAnswer} />
              </div>
            </details>
          ) : (
            <div className="empty-state">
              Presiona “Explicar con IA” para recibir una explicación adaptada a
              tu nivel.
            </div>
          )}
        </aside>

        <section className="practice-panel exercise-panel">
          <div className="panel-title">
            <Sparkles size={18} />
            <h3>Ejercicio generado</h3>
          </div>

          {generatedExercise ? (
            <article className="generated-exercise-card">
              <div className="exercise-meta">
                <span>{generatedExercise.difficulty}</span>
                <span>{generatedExercise.language}</span>
              </div>

              <h4>{generatedExercise.title}</h4>

              <div className="exercise-description">
                <MarkdownContent content={generatedExercise.description} />
              </div>
            </article>
          ) : (
            <div className="exercise-placeholder">
              <Sparkles size={32} />
              <h4>No hay ejercicio generado todavía</h4>
              <p>
                Genera un ejercicio personalizado para practicar el tema
                seleccionado.
              </p>

              <button onClick={onGenerateExercise} disabled={loadingExercise}>
                {loadingExercise ? "Generando..." : "Generar ejercicio"}
              </button>
            </div>
          )}

          <div className="practice-tip">
            <Lightbulb size={17} />
            <p>
              Intenta resolver el ejercicio antes de pedir ayuda. La IA debe
              servir como guía, no como sustituto de tu razonamiento.
            </p>
          </div>
        </section>

        <section className="practice-panel code-panel">
          <div className="code-panel-header">
            <div className="panel-title">
              <Code2 size={18} />
              <h3>Editor de código</h3>
            </div>

            <span className="file-pill">main.py</span>
          </div>

          <div className="editor-shell">
            <CodeEditor
              value={code}
              onChange={onCodeChange}
              language="python"
              height="390px"
            />
          </div>

          <div className="code-actions">
            <button
              onClick={onSubmitCode}
              disabled={!generatedExercise || loadingReview}
            >
              {loadingReview ? "Corrigiendo..." : "Corregir con IA"}
            </button>
          </div>

          {feedback ? (
            <div className="feedback-panel">
              <div className="feedback-header">
                <div>
                  <span className="section-kicker">Retroalimentación</span>
                  <h3>Resultado de la revisión</h3>
                </div>

                {score !== null && score !== undefined && (
                  <div className="score-circle">
                    <Trophy size={20} />
                    <strong>{score}</strong>
                    <span>/100</span>
                  </div>
                )}
              </div>

              {score !== null && score !== undefined && score >= 70 && (
                <div className="success-note">
                  <CheckCircle2 size={18} />
                  Buen trabajo. Este resultado puede marcar el tema como
                  completado.
                </div>
              )}

              <div className="feedback-text">
                <MarkdownContent content={feedback} />
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Cuando envíes tu código, aquí aparecerán errores detectados,
              mejoras sugeridas, explicación y puntuación.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
