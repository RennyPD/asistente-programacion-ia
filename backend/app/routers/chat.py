from fastapi import APIRouter, Depends, HTTPException, Query
from openai import OpenAI
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.config import settings
from app.db.database import get_session
from app.models.models import ChatHistory, Topic, User
from app.routers.auth import get_current_user


router = APIRouter()


class ChatMessageRequest(BaseModel):
    message: str
    topic_id: int | None = None


@router.post("/message")
def send_chat_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    clean_message = request.message.strip()

    if len(clean_message) < 2:
        raise HTTPException(
            status_code=400,
            detail="El mensaje debe tener al menos 2 caracteres."
        )

    topic_context = ""

    if request.topic_id:
        topic = session.get(Topic, request.topic_id)

        if topic:
            topic_context = (
                f"\nTema actual del estudiante: {topic.title}.\n"
                f"Descripción del tema: {topic.description}.\n"
                f"Objetivo del tema: {topic.objective}.\n"
            )

    if not settings.OPENAI_API_KEY:
        answer = (
            "Modo demo del Tutor IA:\n\n"
            f"Entiendo tu duda: {clean_message}\n\n"
            "Aquí la plataforma respondería usando inteligencia artificial. "
            "La respuesta debe explicar paso a paso, dar ejemplos y guiar al estudiante "
            "sin simplemente darle todo resuelto."
        )

        chat = ChatHistory(
            user_id=current_user.id,
            message=clean_message,
            response=answer
        )

        session.add(chat)
        session.commit()
        session.refresh(chat)

        return {
            "response": answer,
            "chat": chat
        }

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "Eres un tutor inteligente de programación para estudiantes de Ingeniería en Software. "
                    "Tu función es apoyar el aprendizaje autodidacta. "
                    "Explica con claridad, usa ejemplos simples, responde paso a paso y fomenta el razonamiento. "
                    "No debes limitarte a dar la respuesta final; debes ayudar al estudiante a comprender."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Nombre del estudiante: {current_user.name}.\n"
                    f"{topic_context}\n"
                    f"Pregunta del estudiante:\n{clean_message}"
                ),
            },
        ],
    )

    answer = response.output_text

    chat = ChatHistory(
        user_id=current_user.id,
        message=clean_message,
        response=answer
    )

    session.add(chat)
    session.commit()
    session.refresh(chat)

    return {
        "response": answer,
        "chat": chat
    }


@router.get("/history")
def get_chat_history(
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = (
        select(ChatHistory)
        .where(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.desc())
        .limit(limit)
    )

    history_desc = session.exec(statement).all()

    return list(reversed(history_desc))


@router.delete("/history")
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(ChatHistory).where(
        ChatHistory.user_id == current_user.id
    )

    history = session.exec(statement).all()

    for item in history:
        session.delete(item)

    session.commit()

    return {
        "message": "Historial de conversaciones eliminado correctamente."
    }