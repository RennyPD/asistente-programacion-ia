import { useState } from "react";
import { BookOpen, Brain, Code2, LineChart, ShieldCheck } from "lucide-react";
import { loginUser, registerUser, saveAuthData } from "../services/authService";
import type { AuthUser } from "../types/learnings";

type AuthPageProps = {
  onAuthSuccess: (user: AuthUser) => void;
};

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [name, setName] = useState("Estudiante UFHEC");
  const [email, setEmail] = useState("estudiante@ufhec.edu.do");
  const [password, setPassword] = useState("123456");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const authResponse = isLoginMode
        ? await loginUser({ email, password })
        : await registerUser({ name, email, password });

      saveAuthData(authResponse);
      onAuthSuccess(authResponse.user);
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        "No se pudo completar la autenticación.";

      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card">
        <aside className="auth-hero">
          <div>
            <h1>
              CodeTutor <span>AI</span> UFHEC
            </h1>

            <p>
              Plataforma inteligente para apoyar el aprendizaje autodidacta de
              programación mediante rutas guiadas, práctica asistida y
              retroalimentación con inteligencia artificial.
            </p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <BookOpen size={18} />
              </span>
              <span>Aprende con rutas organizadas</span>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">
                <Brain size={18} />
              </span>
              <span>Recibe apoyo del Tutor IA</span>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">
                <Code2 size={18} />
              </span>
              <span>Practica con ejercicios de programación</span>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">
                <LineChart size={18} />
              </span>
              <span>Mide tu progreso y desempeño</span>
            </div>
          </div>

          <p>“Aprende. Practica. Mejora. Repite.”</p>
        </aside>

        <div className="auth-form-panel">
          <h2>{isLoginMode ? "Iniciar sesión" : "Crear cuenta"}</h2>

          <p className="auth-subtitle">
            Accede a tu panel personalizado y continúa desarrollando tus
            competencias de programación.
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={isLoginMode ? "auth-tab active" : "auth-tab"}
              onClick={() => setIsLoginMode(true)}
            >
              Iniciar sesión
            </button>

            <button
              type="button"
              className={!isLoginMode ? "auth-tab active" : "auth-tab"}
              onClick={() => setIsLoginMode(false)}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLoginMode && (
              <label>
                Nombre
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nombre del estudiante"
                />
              </label>
            )}

            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ufhec.edu.do"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </label>

            {errorMessage && <div className="auth-error">{errorMessage}</div>}

            <button type="submit" disabled={loading}>
              {loading
                ? "Procesando..."
                : isLoginMode
                  ? "Entrar a la plataforma"
                  : "Crear cuenta"}
            </button>
          </form>

          <p className="auth-subtitle" style={{ marginTop: 18 }}>
            <ShieldCheck size={16} /> Tus datos se utilizan solo para guardar tu
            progreso académico dentro del prototipo.
          </p>
        </div>
      </section>
    </main>
  );
}
