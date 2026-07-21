import { useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  generateAssessment,
  submitAssessment,
} from "../services/assessmentService";
import type {
  AssessmentData,
  AssessmentSubmitResponse,
} from "../types/learnings";

type SelfAssessmentProps = {
  topicId: number;
  topicTitle: string;
  onAssessmentCompleted: () => void;
};

export default function SelfAssessment({
  topicId,
  topicTitle,
  onAssessmentCompleted,
}: SelfAssessmentProps) {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<AssessmentSubmitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setResult(null);
      setAnswers({});

      const data = await generateAssessment(topicId);
      setAssessment(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, option: string) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: option,
    }));
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    const formattedAnswers = assessment.questions.map((question) => ({
      question_id: question.id,
      selected_option: answers[question.id] || "",
    }));

    try {
      setSubmitting(true);

      const response = await submitAssessment(topicId, formattedAnswers);
      setResult(response);
      onAssessmentCompleted();
    } finally {
      setSubmitting(false);
    }
  };

  const allQuestionsAnswered =
    assessment?.questions.every((question) => answers[question.id]) || false;

  const answeredCount = assessment
    ? assessment.questions.filter((question) => answers[question.id]).length
    : 0;

  const progressPercentage = assessment
    ? Math.round((answeredCount / assessment.questions.length) * 100)
    : 0;

  return (
    <section className="assessment-page">
      <div className="assessment-hero">
        <div>
          <span className="section-kicker">Autoevaluación</span>
          <h2>Comprueba tu dominio del tema</h2>
          <p>
            Tema seleccionado: <strong>{topicTitle}</strong>
          </p>
        </div>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 size={16} /> : <ClipboardCheck size={16} />}
          {loading ? "Generando..." : "Generar autoevaluación"}
        </button>
      </div>

      {!assessment && (
        <div className="assessment-empty">
          <HelpCircle size={46} />
          <h3>No hay autoevaluación generada</h3>
          <p>
            Genera una autoevaluación para medir tu comprensión del tema actual.
          </p>
        </div>
      )}

      {assessment && (
        <div className="assessment-layout">
          <section className="assessment-main-card">
            <div className="assessment-progress-header">
              <div>
                <h3>Preguntas</h3>
                <p>
                  Respondidas: {answeredCount} de {assessment.questions.length}
                </p>
              </div>

              <span>{progressPercentage}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="modern-question-list">
              {assessment.questions.map((question, index) => (
                <article key={question.id} className="modern-question-card">
                  <div className="question-number">{index + 1}</div>

                  <div>
                    <h3>{question.question}</h3>

                    <div className="modern-options-list">
                      {Object.entries(question.options).map(
                        ([optionKey, text]) => (
                          <label
                            key={optionKey}
                            className={
                              answers[question.id] === optionKey
                                ? "modern-option selected"
                                : "modern-option"
                            }
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={optionKey}
                              checked={answers[question.id] === optionKey}
                              onChange={() =>
                                handleSelectAnswer(question.id, optionKey)
                              }
                            />

                            <span className="option-letter">{optionKey}</span>
                            <span>{text}</span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="assessment-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                }}
              >
                <RotateCcw size={16} />
                Reiniciar respuestas
              </button>

              <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || submitting}
              >
                {submitting ? (
                  <Loader2 size={16} />
                ) : (
                  <ClipboardCheck size={16} />
                )}
                {submitting ? "Corrigiendo..." : "Enviar respuestas"}
              </button>
            </div>
          </section>

          <aside className="assessment-result-card">
            {!result ? (
              <>
                <div className="score-placeholder">
                  <Trophy size={42} />
                  <h3>Resultado pendiente</h3>
                  <p>
                    Al enviar tus respuestas verás tu puntuación, explicación y
                    recomendaciones.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="assessment-score-circle">
                  <Trophy size={24} />
                  <strong>{result.score}%</strong>
                  <span>
                    {result.correct_answers}/{result.total_questions}
                  </span>
                </div>

                <h3>{result.score >= 70 ? "¡Buen trabajo!" : "A reforzar"}</h3>
                <p>{result.feedback}</p>

                <div className="assessment-results">
                  {result.results.map((item) => (
                    <div
                      key={item.question_id}
                      className={
                        item.is_correct
                          ? "assessment-result correct"
                          : "assessment-result incorrect"
                      }
                    >
                      <div className="result-status">
                        {item.is_correct ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}

                        <strong>
                          {item.is_correct ? "Correcta" : "Incorrecta"}
                        </strong>
                      </div>

                      <p>{item.question}</p>
                      <small>
                        Tu respuesta: {item.selected_option || "Sin responder"}{" "}
                        · Correcta: {item.correct_option}
                      </small>
                      <p>{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
