import { useEffect, useState } from "react";
import { api } from "./services/api";
import {
  completeTopic,
  getLearningPathDetail,
  getLearningPaths,
  getProgressSummary,
} from "./services/learningService";
import {
  generateExercise,
  submitCodeForReview,
} from "./services/exerciseService";
import CodeEditor from "./components/CodeEditor";
import type {
  Exercise,
  LearningPath,
  ProgressSummary,
  Topic,
} from "./types/learnings";
import PracticeHistory from "./components/PracticeHistory";
import "./App.css";

const DEMO_USER_ID = 1;

function App() {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [progress, setProgress] = useState<ProgressSummary>({
    total_topics: 0,
    completed_topics: 0,
    percentage: 0,
    completed_topic_ids: [],
  });

  const [conceptAnswer, setConceptAnswer] = useState("");
  const [generatedExercise, setGeneratedExercise] = useState<Exercise | null>(
    null
  );

  const [code, setCode] = useState("# Escribe tu solución aquí");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null | undefined>(null);

  const [loadingConcept, setLoadingConcept] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    loadLearningPaths();
  }, []);

  const loadLearningPaths = async () => {
    const data = await getLearningPaths();
    setLearningPaths(data);

    if (data.length > 0) {
      await selectLearningPath(data[0].id);
    }
  };

  const selectLearningPath = async (learningPathId: number) => {
    const detail = await getLearningPathDetail(learningPathId);
    setSelectedPath(detail.learning_path);
    setTopics(detail.topics);

    if (detail.topics.length > 0) {
      setSelectedTopic(detail.topics[0]);
    }

    clearExerciseArea();
    await refreshProgress(learningPathId);
  };

  const refreshProgress = async (learningPathId: number) => {
    const summary = await getProgressSummary(DEMO_USER_ID, learningPathId);
    setProgress(summary);
  };

  const clearExerciseArea = () => {
    setConceptAnswer("");
    setGeneratedExercise(null);
    setCode("# Escribe tu solución aquí");
    setFeedback("");
    setScore(null);
  };

  const explainConcept = async () => {
    if (!selectedTopic) return;

    try {
      setLoadingConcept(true);
      setConceptAnswer("");

      const response = await api.post("/ai/explain", {
        topic: selectedTopic.title,
        level: "principiante",
        language: selectedPath?.language || "Python",
      });

      setConceptAnswer(response.data.answer);
    } catch (error) {
      setConceptAnswer("Ocurrió un error al consultar la IA.");
    } finally {
      setLoadingConcept(false);
    }
  };

  const handleGenerateExercise = async () => {
    if (!selectedTopic || !selectedPath) return;

    try {
      setLoadingExercise(true);
      setGeneratedExercise(null);
      setFeedback("");
      setScore(null);
      setCode("# Escribe tu solución aquí");

      const exercise = await generateExercise({
        user_id: DEMO_USER_ID,
        topic_id: selectedTopic.id,
        language: selectedPath.language,
        difficulty: selectedPath.level,
      });

      setGeneratedExercise(exercise);
    } catch (error) {
      setFeedback("Ocurrió un error al generar el ejercicio.");
    } finally {
      setLoadingExercise(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedTopic || !selectedPath || !generatedExercise) return;

    try {
      setLoadingReview(true);
      setFeedback("");
      setScore(null);

      const result = await submitCodeForReview({
        user_id: DEMO_USER_ID,
        topic_id: selectedTopic.id,
        exercise: generatedExercise.description,
        code,
        language: selectedPath.language,
      });

      setFeedback(result.feedback);
      setScore(result.score);
    } catch (error) {
      setFeedback("Ocurrió un error al corregir y guardar el código.");
    } finally {
      setLoadingReview(false);
    }
  };

  const handleCompleteTopic = async (topicId: number) => {
    await completeTopic(DEMO_USER_ID, topicId);

    if (selectedPath) {
      await refreshProgress(selectedPath.id);
    }
  };

  const isTopicCompleted = (topicId: number) => {
    return progress.completed_topic_ids.includes(topicId);
  };

  return (
    <main className="container">
      <h1>CodeTutor AI UFHEC</h1>

      <section className="dashboard">
        <div className="dashboard-card">
          <h2>Panel del estudiante</h2>
          <p>
            <strong>Usuario:</strong> Estudiante Demo
          </p>
          <p>
            <strong>Ruta activa:</strong>{" "}
            {selectedPath ? selectedPath.title : "Cargando..."}
          </p>
          <p>
            <strong>Progreso:</strong> {progress.percentage}%
          </p>

          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <p>
            {progress.completed_topics} de {progress.total_topics} temas
            completados
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Rutas de aprendizaje</h2>

        <div className="path-list">
          {learningPaths.map((path) => (
            <button
              key={path.id}
              className={
                selectedPath?.id === path.id ? "path-button active" : "path-button"
              }
              onClick={() => selectLearningPath(path.id)}
            >
              {path.title}
            </button>
          ))}
        </div>

        {selectedPath && (
          <div className="path-detail">
            <h3>{selectedPath.title}</h3>
            <p>{selectedPath.description}</p>
            <p>
              <strong>Nivel:</strong> {selectedPath.level}
            </p>
            <p>
              <strong>Lenguaje:</strong> {selectedPath.language}
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Temas de la ruta</h2>

        <div className="topics-grid">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className={
                selectedTopic?.id === topic.id ? "topic-card selected" : "topic-card"
              }
              onClick={() => {
                setSelectedTopic(topic);
                clearExerciseArea();
              }}
            >
              <div className="topic-header">
                <span>
                  {topic.order_number}. {topic.title}
                </span>
                {isTopicCompleted(topic.id) && (
                  <span className="completed-badge">Completado</span>
                )}
              </div>

              <p>{topic.description}</p>
              <small>
                <strong>Objetivo:</strong> {topic.objective}
              </small>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleCompleteTopic(topic.id);
                }}
              >
                Marcar como completado
              </button>
            </div>
          ))}
        </div>
      </section>

      {selectedTopic && (
        <section className="card">
          <h2>Explicación de conceptos con IA</h2>

          <p>
            <strong>Tema seleccionado:</strong> {selectedTopic.title}
          </p>

          <button onClick={explainConcept} disabled={loadingConcept}>
            {loadingConcept ? "Consultando..." : "Explicar tema con IA"}
          </button>

          {conceptAnswer && (
            <div className="result">
              <h3>Respuesta del tutor IA</h3>
              <p>{conceptAnswer}</p>
            </div>
          )}
        </section>
      )}

      {selectedTopic && (
        <section className="card">
          <h2>Generador de ejercicios</h2>

          <p>
            <strong>Tema:</strong> {selectedTopic.title}
          </p>

          <button onClick={handleGenerateExercise} disabled={loadingExercise}>
            {loadingExercise ? "Generando..." : "Generar ejercicio con IA"}
          </button>

          {generatedExercise && (
            <div className="exercise-box">
              <h3>{generatedExercise.title}</h3>
              <p>{generatedExercise.description}</p>
            </div>
          )}
        </section>
      )}

      {generatedExercise && (
        <section className="card">
          <h2>Resolver ejercicio</h2>

          <p>
            Escribe tu solución en el editor y luego envíala para recibir
            retroalimentación.
          </p>

          <CodeEditor value={code} onChange={setCode} />

          <button onClick={handleSubmitCode} disabled={loadingReview}>
            {loadingReview ? "Corrigiendo..." : "Corregir y guardar código"}
          </button>

          {feedback && (
            <div className="result">
              <h3>Retroalimentación</h3>

              {score !== null && score !== undefined && (
                <p className="score-badge">
                  <strong>Puntuación:</strong> {score}/100
                </p>
              )}

              <p>{feedback}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;