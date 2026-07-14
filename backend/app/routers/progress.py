from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.database import get_session
from app.models.models import Progress, Topic


router = APIRouter()


class CompleteTopicRequest(BaseModel):
    user_id: int
    topic_id: int


@router.post("/complete-topic")
def complete_topic(
    request: CompleteTopicRequest,
    session: Session = Depends(get_session)
):
    topic = session.get(Topic, request.topic_id)

    if not topic:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")

    statement = select(Progress).where(
        Progress.user_id == request.user_id,
        Progress.topic_id == request.topic_id
    )

    progress = session.exec(statement).first()

    if progress:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        session.add(progress)
    else:
        progress = Progress(
            user_id=request.user_id,
            topic_id=request.topic_id,
            completed=True,
            completed_at=datetime.utcnow()
        )
        session.add(progress)

    session.commit()
    session.refresh(progress)

    return {
        "message": "Tema marcado como completado.",
        "progress": progress
    }


@router.get("/summary")
def get_progress_summary(
    user_id: int,
    learning_path_id: int,
    session: Session = Depends(get_session)
):
    topics_statement = select(Topic).where(
        Topic.learning_path_id == learning_path_id
    )

    topics = session.exec(topics_statement).all()

    if not topics:
        return {
            "total_topics": 0,
            "completed_topics": 0,
            "percentage": 0,
            "completed_topic_ids": []
        }

    topic_ids = [topic.id for topic in topics]

    progress_statement = select(Progress).where(
        Progress.user_id == user_id,
        Progress.topic_id.in_(topic_ids),
        Progress.completed == True
    )

    completed_progress = session.exec(progress_statement).all()

    completed_topic_ids = [progress.topic_id for progress in completed_progress]

    percentage = round((len(completed_topic_ids) / len(topics)) * 100)

    return {
        "total_topics": len(topics),
        "completed_topics": len(completed_topic_ids),
        "percentage": percentage,
        "completed_topic_ids": completed_topic_ids
    }