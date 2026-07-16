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
import PracticeHistory from "./components/PracticeHistory";
import type {
  Exercise,
  LearningPath,
  ProgressSummary,
  Topic,
} from "./types/learnings";
import TutorChat from "./components/TutorChat";
import "./App.css";
import AuthPage from "./components/AuthPage";
import { clearAuthData, getStoredUser } from "./services/authService";
import type { AuthUser } from "./types/learnings";
import SelfAssessment from "./components/SelfAssessment";
import SurveyForm from "./components/SurveyForm";
import PracticeWorkspace from "./components/PracticeWorkspace";

import {
  BarChart3,
  BookOpen,
  Brain,
  ClipboardCheck,
  Code2,
  Home,
  LineChart,
  MessageSquareText,
  Send,
} from "lucide-react";

type AppSection =
  | "dashboard"
  | "learning"
  | "tutor"
  | "practice"
  | "assessment"
  | "history"
  | "survey";

// Items de navegación estáticos fuera del componente para evitar recreación en cada render
const navigationItems: {
  key: AppSection;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "dashboard", label: "Panel", icon: <Home size={18} /> },
  {
    key: "learning",
    label: "Ruta de aprendizaje",
    icon: <BookOpen size={18} />,
  },
  { key: "tutor", label: "Tutor IA", icon: <MessageSquareText size={18} /> },
  { key: "practice", label: "Práctica", icon: <Code2 size={18} /> },
  {
    key: "assessment",
    label: "Autoevaluación",
    icon: <ClipboardCheck size={18} />,
  },
  { key: "history", label: "Historial", icon: <LineChart size={18} /> },
  { key: "survey", label: "Encuesta", icon: <Send size={18} /> },
];

function App() {
  // ==========================================
  // 1. ESTADOS
  // ==========================================
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    getStoredUser(),
  );

  const [progress, setProgress] = useState<ProgressSummary>({
    total_topics: 0,
    completed_topics: 0,
    percentage: 0,
    completed_topic_ids: [],
  });

  const [conceptAnswer, setConceptAnswer] = useState("");
  const [generatedExercise, setGeneratedExercise] = useState<Exercise | null>(
    null,
  );

  const [code, setCode] = useState("# Escribe tu solución aquí");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null | undefined>(null);

  const [loadingConcept, setLoadingConcept] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // ==========================================
  // 2. FUNCIONES DEL COMPONENTE
  // ==========================================
  const refreshProgress = async (learningPathId: number) => {
    const summary = await getProgressSummary(currentUser!.id, learningPathId);
    setProgress(summary);
  };

  const clearExerciseArea = () => {
    setConceptAnswer("");
    setGeneratedExercise(null);
    setCode("# Escribe tu solución aquí");
    setFeedback("");
    setScore(null);
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

  const loadLearningPaths = async () => {
    const data = await getLearningPaths();
    setLearningPaths(data);

    if (data.length > 0) {
      await selectLearningPath(data[0].id);
    }
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
        user_id: currentUser!.id,
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
        user_id: currentUser!.id,
        topic_id: selectedTopic.id,
        exercise: generatedExercise.description,
        code,
        language: selectedPath.language,
      });

      setFeedback(result.feedback);
      setScore(result.score);
      setHistoryRefreshKey((currentValue) => currentValue + 1);

      if (selectedPath) {
        await refreshProgress(selectedPath.id);
      }
    } catch (error) {
      setFeedback("Ocurrió un error al corregir y guardar el código.");
    } finally {
      setLoadingReview(false);
    }
  };

  const handleCompleteTopic = async (topicId: number) => {
    await completeTopic(currentUser!.id, topicId);

    if (selectedPath) {
      await refreshProgress(selectedPath.id);
    }
  };

  const isTopicCompleted = (topicId: number) => {
    return progress.completed_topic_ids.includes(topicId);
  };

  // ==========================================
  // 3. EFECTOS
  // ==========================================
  useEffect(() => {
    if (currentUser) {
      loadLearningPaths();
    }
  }, [currentUser]);

  // ==========================================
  // 4. RENDERIZADO (HTML / JSX)
  // ==========================================
  if (!currentUser) {
    return <AuthPage onAuthSuccess={setCurrentUser} />;
  }

  return (
    <div className="app-shell">
      {/* MENÚ LATERAL */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>
            CodeTutor <span>AI</span>
          </h2>
          <p>UFHEC · Instructor inteligente</p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              className={
                activeSection === item.key
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
              onClick={() => setActiveSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <strong>{currentUser.name}</strong>
          <span>{currentUser.email}</span>

          <button
            className="logout-button"
            onClick={() => {
              clearAuthData();
              setCurrentUser(null);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              CodeTutor <span>AI</span> UFHEC
            </h1>
            <p>
              Plataforma inteligente de apoyo al aprendizaje autodidacta de
              programación para estudiantes de Ingeniería en Software.
            </p>
          </div>

          <span className="topbar-badge">Prototipo académico</span>
        </header>

        {/* 1. SECCIÓN: PANEL (DASHBOARD) */}
        {activeSection === "dashboard" && (
          <>
            <section className="dashboard">
              <div className="dashboard-card">
                <h2>Panel del estudiante</h2>
                <p>
                  <strong>Usuario:</strong> {currentUser.name}
                </p>

                <p>
                  <strong>Correo:</strong> {currentUser.email}
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

            {/* Panel de Estadísticas en tiempo real */}
            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{progress.percentage}%</span>
                <span className="stat-label">Progreso general</span>
              </div>

              <div className="stat-card">
                <span className="stat-value">{progress.completed_topics}</span>
                <span className="stat-label">Temas completados</span>
              </div>

              <div className="stat-card">
                <span className="stat-value">{progress.total_topics}</span>
                <span className="stat-label">Temas disponibles</span>
              </div>

              <div className="stat-card">
                <span className="stat-value">
                  <BarChart3 size={26} />
                </span>
                <span className="stat-label">Seguimiento activo</span>
              </div>
            </section>

            {/* Accesos rápidos en el Dashboard */}
            <section className="quick-actions-grid">
              <button
                className="quick-action-card"
                onClick={() => setActiveSection("learning")}
              >
                <strong>Continuar ruta</strong>
                <span>Revisa los temas y objetivos de aprendizaje.</span>
              </button>

              <button
                className="quick-action-card"
                onClick={() => setActiveSection("tutor")}
              >
                <strong>Hablar con Tutor IA</strong>
                <span>Resuelve dudas con asistencia inteligente.</span>
              </button>

              <button
                className="quick-action-card"
                onClick={() => setActiveSection("practice")}
              >
                <strong>Practicar código</strong>
                <span>Genera ejercicios y recibe retroalimentación.</span>
              </button>

              <button
                className="quick-action-card"
                onClick={() => setActiveSection("assessment")}
              >
                <strong>Autoevaluarte</strong>
                <span>Mide tu comprensión del tema seleccionado.</span>
              </button>
            </section>
          </>
        )}

        {/* 2. SECCIÓN: RUTA DE APRENDIZAJE */}
        {activeSection === "learning" && (
          <>
            {/* Rutas de aprendizaje */}
            <section className="card">
              <h2>Rutas de aprendizaje</h2>

              <div className="path-list">
                {learningPaths.map((path) => (
                  <button
                    key={path.id}
                    className={
                      selectedPath?.id === path.id
                        ? "path-button active"
                        : "path-button"
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

            {/* Temas de la ruta */}
            <section className="card">
              <h2>Temas de la ruta</h2>

              <div className="topics-grid">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={
                      selectedTopic?.id === topic.id
                        ? "topic-card selected"
                        : "topic-card"
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

                    <div className="topic-actions">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCompleteTopic(topic.id);
                        }}
                      >
                        Marcar como completado
                      </button>

                      <button
                        className="secondary-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedTopic(topic);
                          clearExerciseArea();
                          setActiveSection("practice");
                        }}
                      >
                        Practicar este tema
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* 3. SECCIÓN: TUTOR IA */}
        {activeSection === "tutor" && selectedTopic && (
          <TutorChat
            selectedTopicId={selectedTopic.id}
            selectedTopicTitle={selectedTopic.title}
          />
        )}

        {/* 4. SECCIÓN: PRÁCTICA */}
        {activeSection === "practice" && selectedTopic && (
          <PracticeWorkspace
            selectedTopic={selectedTopic}
            language={selectedPath?.language || "Python"}
            conceptAnswer={conceptAnswer}
            generatedExercise={generatedExercise}
            code={code}
            feedback={feedback}
            score={score}
            loadingConcept={loadingConcept}
            loadingExercise={loadingExercise}
            loadingReview={loadingReview}
            onExplainConcept={explainConcept}
            onGenerateExercise={handleGenerateExercise}
            onCodeChange={setCode}
            onSubmitCode={handleSubmitCode}
            onResetPractice={() => {
              setCode("# Escribe tu solución aquí");
              setFeedback("");
              setScore(null);
            }}
          />
        )}

        {/* 5. SECCIÓN: AUTOEVALUACIÓN */}
        {activeSection === "assessment" && selectedTopic && (
          <section className="card">
            <h2>Autoevaluación</h2>
            <SelfAssessment
              topicId={selectedTopic.id}
              topicTitle={selectedTopic.title}
              onAssessmentCompleted={() => {
                if (selectedPath) {
                  refreshProgress(selectedPath.id);
                }
              }}
            />
          </section>
        )}

        {/* 6. SECCIÓN: ENCUESTA DE SATISFACCIÓN */}
        {activeSection === "survey" && (
          <section className="card">
            <h2>Encuesta de Satisfacción</h2>
            <SurveyForm />
          </section>
        )}

        {/* 7. SECCIÓN: HISTORIAL DE PRÁCTICAS */}
        {activeSection === "history" && (
          <PracticeHistory
            userId={currentUser.id}
            selectedTopicId={selectedTopic?.id}
            refreshKey={historyRefreshKey}
          />
        )}
      </main>
    </div>
  );
}

export default App;
