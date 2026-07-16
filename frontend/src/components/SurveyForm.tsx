import { useState } from "react";
import {
  CheckCircle2,
  MessageSquareText,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import { submitSurvey } from "../services/surveyService";

const ratingLabels = ["Muy bajo", "Bajo", "Aceptable", "Bueno", "Excelente"];

type RatingRowProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function RatingRow({ label, value, onChange }: RatingRowProps) {
  return (
    <div className="rating-row">
      <span>{label}</span>

      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className={
              value === rating ? "rating-button active" : "rating-button"
            }
            onClick={() => onChange(rating)}
            title={ratingLabels[rating - 1]}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SurveyForm() {
  const [usefulness, setUsefulness] = useState(5);
  const [easeOfUse, setEaseOfUse] = useState(5);
  const [aiSupport, setAiSupport] = useState(5);
  const [recommendation, setRecommendation] = useState(5);
  const [favoriteFeature, setFavoriteFeature] = useState("Tutor IA");
  const [comments, setComments] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const average =
    Math.round(
      ((usefulness + easeOfUse + aiSupport + recommendation) / 4) * 10,
    ) / 10;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      await submitSurvey({
        usefulness,
        ease_of_use: easeOfUse,
        ai_support: aiSupport,
        recommendation,
        favorite_feature: favoriteFeature,
        comments,
      });

      setMessage("Encuesta guardada correctamente. Gracias por tu opinión.");
    } catch {
      setMessage("No se pudo guardar la encuesta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="survey-page">
      <div className="survey-hero">
        <div>
          <span className="section-kicker">Encuesta de percepción</span>
          <h2>Evalúa tu experiencia con CodeTutor AI UFHEC</h2>
          <p>
            Tu opinión permite validar la utilidad, aceptación y mejora del
            prototipo.
          </p>
        </div>

        <div className="survey-score-preview">
          <Star size={24} />
          <strong>{average}/5</strong>
          <span>Promedio actual</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="survey-layout">
        <section className="survey-card">
          <div className="panel-title">
            <Star size={18} />
            <h3>Calificación de experiencia</h3>
          </div>

          <RatingRow
            label="Utilidad de la plataforma"
            value={usefulness}
            onChange={setUsefulness}
          />

          <RatingRow
            label="Facilidad de uso"
            value={easeOfUse}
            onChange={setEaseOfUse}
          />

          <RatingRow
            label="Apoyo de la IA"
            value={aiSupport}
            onChange={setAiSupport}
          />

          <RatingRow
            label="Recomendación a otros estudiantes"
            value={recommendation}
            onChange={setRecommendation}
          />
        </section>

        <section className="survey-card">
          <div className="panel-title">
            <MessageSquareText size={18} />
            <h3>Opinión cualitativa</h3>
          </div>

          <label>
            Funcionalidad favorita
            <select
              value={favoriteFeature}
              onChange={(event) => setFavoriteFeature(event.target.value)}
            >
              <option value="Tutor IA">Tutor IA</option>
              <option value="Generador de ejercicios">
                Generador de ejercicios
              </option>
              <option value="Corrector de código">Corrector de código</option>
              <option value="Rutas de aprendizaje">Rutas de aprendizaje</option>
              <option value="Seguimiento del progreso">
                Seguimiento del progreso
              </option>
              <option value="Autoevaluación">Autoevaluación</option>
            </select>
          </label>

          <label>
            Comentarios adicionales
            <textarea
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Escribe tu opinión sobre el prototipo..."
              rows={5}
            />
          </label>

          <div className="privacy-note">
            <ShieldCheck size={18} />
            <span>
              Tus respuestas se usan únicamente para evaluar la percepción del
              prototipo.
            </span>
          </div>

          <button type="submit" disabled={loading}>
            <Send size={16} />
            {loading ? "Guardando..." : "Enviar encuesta"}
          </button>

          {message && (
            <div className="survey-message">
              <CheckCircle2 size={18} />
              {message}
            </div>
          )}
        </section>
      </form>
    </section>
  );
}
