from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.database import get_session
from app.models.models import LearningPath, Topic


router = APIRouter()


@router.get("/")
def get_learning_paths(session: Session = Depends(get_session)):
    statement = select(LearningPath)
    learning_paths = session.exec(statement).all()

    return learning_paths


@router.get("/{learning_path_id}")
def get_learning_path_detail(
    learning_path_id: int,
    session: Session = Depends(get_session)
):
    learning_path = session.get(LearningPath, learning_path_id)

    if not learning_path:
        raise HTTPException(status_code=404, detail="Ruta de aprendizaje no encontrada.")

    topics_statement = (
        select(Topic)
        .where(Topic.learning_path_id == learning_path_id)
        .order_by(Topic.order_number)
    )

    topics = session.exec(topics_statement).all()

    return {
        "learning_path": learning_path,
        "topics": topics
    }


@router.get("/{learning_path_id}/topics")
def get_topics_by_learning_path(
    learning_path_id: int,
    session: Session = Depends(get_session)
):
    statement = (
        select(Topic)
        .where(Topic.learning_path_id == learning_path_id)
        .order_by(Topic.order_number)
    )

    topics = session.exec(statement).all()

    return topics