import { useState } from "react";
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
        <h1>CodeTutor AI UFHEC</h1>

        <p className="auth-subtitle">
          Plataforma inteligente de apoyo al aprendizaje autodidacta de
          programación.
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
            Correo
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
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}
