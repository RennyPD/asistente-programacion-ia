from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI

from app.core.config import settings


router = APIRouter()


class ExplainConceptRequest(BaseModel):
    topic: str
    level: str = "principiante"
    language: str = "Python"


class CodeReviewRequest(BaseModel):
    code: str
    exercise: str
    language: str = "Python"


@router.post("/explain")
def explain_concept(request: ExplainConceptRequest):
    if not settings.OPENAI_API_KEY:
        return {
            "answer": f"Modo demo: explicación básica sobre {request.topic}. Aquí irá la respuesta real de la IA cuando configures la API key."
        }

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "Eres un tutor de programación para estudiantes de Ingeniería en Software de la UFHEC. "
                    "Explica de forma clara, paso a paso, con ejemplos simples. "
                    "No fomentes copiar y pegar; ayuda al estudiante a razonar."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Explica el tema '{request.topic}' en el lenguaje {request.language} "
                    f"para un estudiante de nivel {request.level}."
                ),
            },
        ],
    )

    return {"answer": response.output_text}


@router.post("/review-code")
def review_code(request: CodeReviewRequest):
    if not settings.OPENAI_API_KEY:
        return {
            "feedback": "Modo demo: aquí se mostraría la corrección del código, errores encontrados, explicación y puntuación."
        }

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "Eres un tutor de programación. Analiza el código del estudiante. "
                    "No solo des la solución final. Explica errores, mejoras, buenas prácticas "
                    "y asigna una puntuación del 1 al 100."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Ejercicio:\n{request.exercise}\n\n"
                    f"Lenguaje: {request.language}\n\n"
                    f"Código del estudiante:\n{request.code}"
                ),
            },
        ],
    )

    return {"feedback": response.output_text}