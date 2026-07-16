import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.database import get_session
from app.models.models import AssessmentResult, Progress, Topic, User
from app.routers.auth import get_current_user


router = APIRouter()


class AnswerRequest(BaseModel):
    question_id: int
    selected_option: str


class SubmitAssessmentRequest(BaseModel):
    topic_id: int
    answers: list[AnswerRequest]


def get_questions_by_topic(topic_title: str):
    title = topic_title.lower()

    if "variable" in title:
        return [
            {
                "id": 1,
                "question": "¿Qué es una variable en programación?",
                "options": {
                    "A": "Un espacio para almacenar datos",
                    "B": "Un error del programa",
                    "C": "Un tipo de bucle",
                    "D": "Una función obligatoria"
                },
                "correct_option": "A",
                "explanation": "Una variable permite guardar datos para usarlos posteriormente."
            },
            {
                "id": 2,
                "question": "¿Cuál de estos es un tipo de dato común?",
                "options": {
                    "A": "Texto",
                    "B": "Pantalla",
                    "C": "Teclado",
                    "D": "Archivo ejecutable"
                },
                "correct_option": "A",
                "explanation": "Texto, números y booleanos son tipos de datos comunes."
            },
            {
                "id": 3,
                "question": "En Python, ¿cuál asignación es válida?",
                "options": {
                    "A": "nombre = 'Ana'",
                    "B": "nombre :=: Ana",
                    "C": "variable nombre Ana",
                    "D": "guardar nombre Ana"
                },
                "correct_option": "A",
                "explanation": "En Python se usa el signo igual para asignar valores."
            }
        ]

    if "condicional" in title:
        return [
            {
                "id": 1,
                "question": "¿Para qué sirve una estructura condicional?",
                "options": {
                    "A": "Para repetir código infinitamente",
                    "B": "Para tomar decisiones según una condición",
                    "C": "Para crear bases de datos",
                    "D": "Para instalar librerías"
                },
                "correct_option": "B",
                "explanation": "Los condicionales permiten ejecutar bloques de código dependiendo de una condición."
            },
            {
                "id": 2,
                "question": "¿Cuál palabra clave se usa en Python para iniciar una condición?",
                "options": {
                    "A": "if",
                    "B": "for",
                    "C": "def",
                    "D": "try"
                },
                "correct_option": "A",
                "explanation": "La palabra clave if permite evaluar una condición."
            },
            {
                "id": 3,
                "question": "¿Qué representa else?",
                "options": {
                    "A": "Una alternativa si la condición no se cumple",
                    "B": "Una función",
                    "C": "Un comentario",
                    "D": "Un ciclo"
                },
                "correct_option": "A",
                "explanation": "else se ejecuta cuando la condición principal no se cumple."
            }
        ]

    if "bucle" in title:
        return [
            {
                "id": 1,
                "question": "¿Para qué sirve un bucle?",
                "options": {
                    "A": "Para repetir instrucciones",
                    "B": "Para borrar variables",
                    "C": "Para crear contraseñas",
                    "D": "Para detener siempre el programa"
                },
                "correct_option": "A",
                "explanation": "Los bucles permiten ejecutar instrucciones varias veces."
            },
            {
                "id": 2,
                "question": "¿Cuál bucle suele usarse cuando se conoce la cantidad de repeticiones?",
                "options": {
                    "A": "for",
                    "B": "while",
                    "C": "try",
                    "D": "class"
                },
                "correct_option": "A",
                "explanation": "for suele usarse cuando se conoce o se puede recorrer una secuencia."
            },
            {
                "id": 3,
                "question": "¿Qué riesgo existe con un while mal diseñado?",
                "options": {
                    "A": "Un bucle infinito",
                    "B": "Que borre Python",
                    "C": "Que cambie el sistema operativo",
                    "D": "Que cree una variable automática"
                },
                "correct_option": "A",
                "explanation": "Si la condición nunca cambia a falsa, el while puede ejecutarse indefinidamente."
            }
        ]

    return [
        {
            "id": 1,
            "question": f"¿Cuál es el objetivo principal del tema '{topic_title}'?",
            "options": {
                "A": "Comprender y aplicar el concepto en ejercicios prácticos",
                "B": "Memorizar sin practicar",
                "C": "Evitar escribir código",
                "D": "Copiar respuestas sin analizarlas"
            },
            "correct_option": "A",
            "explanation": "El aprendizaje de programación requiere comprender y practicar."
        },
        {
            "id": 2,
            "question": "¿Qué debes hacer cuando no entiendes un error de código?",
            "options": {
                "A": "Analizar el mensaje, revisar el código y buscar explicación",
                "B": "Borrar todo sin revisar",
                "C": "Ignorar el error",
                "D": "Cerrar el editor"
            },
            "correct_option": "A",
            "explanation": "La resolución de errores es parte esencial del aprendizaje."
        },
        {
            "id": 3,
            "question": "¿Qué ayuda más al aprendizaje autodidacta?",
            "options": {
                "A": "Practicar, recibir retroalimentación y seguir una ruta",
                "B": "Estudiar sin orden",
                "C": "No hacer ejercicios",
                "D": "Usar IA sin pensar"
            },
            "correct_option": "A",
            "explanation": "Una ruta organizada y la práctica constante fortalecen el aprendizaje."
        }
    ]


def mark_topic_completed_if_passed(
    session: Session,
    user_id: int,
    topic_id: int,
    score: int
):
    if score < 70:
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


@router.get("/generate/{topic_id}")
def generate_assessment(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    topic = session.get(Topic, topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    questions = get_questions_by_topic(topic.title)

    public_questions = []

    for question in questions:
        public_questions.append({
            "id": question["id"],
            "question": question["question"],
            "options": question["options"]
        })

    return {
        "topic_id": topic.id,
        "topic_title": topic.title,
        "questions": public_questions
    }


@router.post("/submit")
def submit_assessment(
    request: SubmitAssessmentRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    topic = session.get(Topic, request.topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    questions = get_questions_by_topic(topic.title)
    questions_by_id = {question["id"]: question for question in questions}

    total_questions = len(questions)
    correct_answers = 0
    detailed_results = []

    for answer in request.answers:
        question = questions_by_id.get(answer.question_id)

        if not question:
            continue

        is_correct = answer.selected_option == question["correct_option"]

        if is_correct:
            correct_answers += 1

        detailed_results.append({
            "question_id": answer.question_id,
            "question": question["question"],
            "selected_option": answer.selected_option,
            "correct_option": question["correct_option"],
            "is_correct": is_correct,
            "explanation": question["explanation"]
        })

    score = round((correct_answers / total_questions) * 100)

    if score >= 70:
        feedback = "Buen trabajo. Has demostrado comprensión suficiente del tema."
    else:
        feedback = "Necesitas reforzar este tema antes de marcarlo como dominado."

    result = AssessmentResult(
        user_id=current_user.id,
        topic_id=request.topic_id,
        total_questions=total_questions,
        correct_answers=correct_answers,
        score=score,
        answers_json=json.dumps(detailed_results, ensure_ascii=False),
        feedback=feedback
    )

    session.add(result)

    mark_topic_completed_if_passed(
        session=session,
        user_id=current_user.id,
        topic_id=request.topic_id,
        score=score
    )

    session.commit()
    session.refresh(result)

    return {
        "message": "Autoevaluación corregida y guardada correctamente.",
        "score": score,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "feedback": feedback,
        "results": detailed_results
    }


@router.get("/results")
def get_assessment_results(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = (
        select(AssessmentResult)
        .where(AssessmentResult.user_id == current_user.id)
        .order_by(AssessmentResult.created_at.desc())
    )

    results = session.exec(statement).all()

    return results