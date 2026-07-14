import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.config import settings
from app.db.database import get_session
from app.models.models import Exercise, Submission, Topic, Progress


router = APIRouter()


class GenerateExerciseRequest(BaseModel):
    user_id: int
    topic_id: int
    language: str = "Python"
    difficulty: str = "Básico"


class SubmitCodeRequest(BaseModel):
    user_id: int
    topic_id: int
    exercise: str
    code: str
    language: str = "Python"

def mark_topic_completed_if_passed(
    session: Session,
    user_id: int,
    topic_id: int,
    score: int | None
):
    if score is None or score < 70:
        return

    statement = select(Progress).where(
        Progress.user_id == user_id,
        Progress.topic_id == topic_id
    )

    progress = session.exec(statement).first()

    if progress:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        session.add(progress)
    else:
        progress = Progress(
            user_id=user_id,
            topic_id=topic_id,
            completed=True,
            completed_at=datetime.utcnow()
        )
        session.add(progress)

def extract_score(feedback: str) -> int | None:
    patterns = [
        r"puntuaci[oó]n\s*[:\-]?\s*(\d{1,3})",
        r"(\d{1,3})\s*/\s*100",
    ]

    for pattern in patterns:
        match = re.search(pattern, feedback, re.IGNORECASE)
        if match:
            score = int(match.group(1))
            return max(0, min(score, 100))

    return None


@router.post("/generate")
def generate_exercise(
    request: GenerateExerciseRequest,
    session: Session = Depends(get_session)
):
    topic = session.get(Topic, request.topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    if not settings.OPENAI_API_KEY:
        demo_description = (
            f"Título: Ejercicio de {topic.title}\n\n"
            f"Enunciado:\n"
            f"Crea un programa en {request.language} relacionado con el tema '{topic.title}'.\n\n"
            f"Requisitos:\n"
            f"- Usa una solución sencilla.\n"
            f"- Aplica el concepto principal del tema.\n"
            f"- Muestra el resultado en pantalla.\n\n"
            f"Pista:\n"
            f"Piensa primero en los datos de entrada, luego en el proceso y finalmente en la salida."
        )

        exercise = Exercise(
            user_id=request.user_id,
            topic_id=request.topic_id,
            title=f"Ejercicio de {topic.title}",
            description=demo_description,
            difficulty=request.difficulty,
            language=request.language,
            created_by_ai=False,
        )

        session.add(exercise)
        session.commit()
        session.refresh(exercise)

        return exercise

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "Eres un tutor de programación para estudiantes de Ingeniería en Software. "
                    "Genera ejercicios claros, prácticos y adecuados al nivel del estudiante. "
                    "No incluyas la solución completa, solo el enunciado, requisitos y pistas."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Genera un ejercicio de programación en {request.language}.\n"
                    f"Tema: {topic.title}\n"
                    f"Descripción del tema: {topic.description}\n"
                    f"Nivel: {request.difficulty}\n\n"
                    f"Devuelve el ejercicio con este formato:\n"
                    f"Título:\n"
                    f"Enunciado:\n"
                    f"Requisitos:\n"
                    f"Pistas:\n"
                ),
            },
        ],
    )

    exercise_text = response.output_text

    exercise = Exercise(
        user_id=request.user_id,
        topic_id=request.topic_id,
        title=f"Ejercicio de {topic.title}",
        description=exercise_text,
        difficulty=request.difficulty,
        language=request.language,
        created_by_ai=True,
    )

    session.add(exercise)
    session.commit()
    session.refresh(exercise)

    return exercise


@router.post("/submit-code")
def submit_code(
    request: SubmitCodeRequest,
    session: Session = Depends(get_session)
):
    topic = session.get(Topic, request.topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    if not settings.OPENAI_API_KEY:
        feedback = (
            "Retroalimentación modo demo:\n\n"
            "Tu código fue recibido correctamente.\n"
            "Revisa que cumpla con el enunciado, que tenga buena indentación "
            "y que muestre el resultado esperado.\n\n"
            "Puntuación: 85/100"
        )

        submission = Submission(
            user_id=request.user_id,
            topic_id=request.topic_id,
            exercise=request.exercise,
            code=request.code,
            ai_feedback=feedback,
            score=85,
            
          
        )

        session.add(submission)

        mark_topic_completed_if_passed(
        session=session,
        user_id=request.user_id,
        topic_id=request.topic_id,
        score=85
        )  
        
        session.commit()
        session.refresh(submission)

        return {
            "message": "Código corregido y guardado correctamente.",
            "feedback": feedback,
            "score": 85,
            "submission": submission,
        }

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "Eres un tutor de programación. Corrige el código de un estudiante. "
                    "No solo des la respuesta final. Explica los errores, indica mejoras, "
                    "menciona buenas prácticas y asigna una puntuación del 1 al 100. "
                    "Incluye la puntuación usando el formato: Puntuación: X/100."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Tema: {topic.title}\n\n"
                    f"Ejercicio:\n{request.exercise}\n\n"
                    f"Lenguaje: {request.language}\n\n"
                    f"Código del estudiante:\n{request.code}"
                ),
            },
        ],
    )

    feedback = response.output_text
    score = extract_score(feedback)

    submission = Submission(
        user_id=request.user_id,
        topic_id=request.topic_id,
        exercise=request.exercise,
        code=request.code,
        ai_feedback=feedback,
        score=score,
    )

    session.add(submission)
    mark_topic_completed_if_passed(
    session=session,
    user_id=request.user_id,
    topic_id=request.topic_id,
    score=85
    )  
    session.commit()
    session.refresh(submission)

    return {
        "message": "Código corregido y guardado correctamente.",
        "feedback": feedback,
        "score": score,
        "submission": submission,
    }


@router.get("/submissions")
def get_submissions(
    user_id: int,
    topic_id: int | None = None,
    session: Session = Depends(get_session)
):
    statement = select(Submission).where(Submission.user_id == user_id)

    if topic_id:
        statement = statement.where(Submission.topic_id == topic_id)

    statement = statement.order_by(Submission.created_at.desc())

    submissions = session.exec(statement).all()

    return submissions

@router.get("/stats")
def get_practice_stats(
    user_id: int,
    session: Session = Depends(get_session)
):
    statement = select(Submission).where(Submission.user_id == user_id)
    submissions = session.exec(statement).all()

    if not submissions:
        return {
            "total_submissions": 0,
            "average_score": 0,
            "best_score": 0,
            "topics_practiced": 0,
            "last_submission_at": None
        }

    scores = [
        submission.score
        for submission in submissions
        if submission.score is not None
    ]

    average_score = round(sum(scores) / len(scores)) if scores else 0
    best_score = max(scores) if scores else 0

    topics_practiced = len(
        set(submission.topic_id for submission in submissions)
    )

    last_submission = sorted(
        submissions,
        key=lambda submission: submission.created_at,
        reverse=True
    )[0]

    return {
        "total_submissions": len(submissions),
        "average_score": average_score,
        "best_score": best_score,
        "topics_practiced": topics_practiced,
        "last_submission_at": last_submission.created_at
    }