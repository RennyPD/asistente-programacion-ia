from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.database import get_session
from app.models.models import SurveyResponse, User
from app.routers.auth import get_current_user


router = APIRouter()


class SurveyRequest(BaseModel):
    usefulness: int
    ease_of_use: int
    ai_support: int
    recommendation: int
    favorite_feature: str
    comments: str | None = None


def validate_score(value: int, field_name: str):
    if value < 1 or value > 5:
        raise HTTPException(
            status_code=400,
            detail=f"El campo {field_name} debe estar entre 1 y 5."
        )


@router.post("/")
def submit_survey(
    request: SurveyRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    validate_score(request.usefulness, "usefulness")
    validate_score(request.ease_of_use, "ease_of_use")
    validate_score(request.ai_support, "ai_support")
    validate_score(request.recommendation, "recommendation")

    survey = SurveyResponse(
        user_id=current_user.id,
        usefulness=request.usefulness,
        ease_of_use=request.ease_of_use,
        ai_support=request.ai_support,
        recommendation=request.recommendation,
        favorite_feature=request.favorite_feature,
        comments=request.comments
    )

    session.add(survey)
    session.commit()
    session.refresh(survey)

    return {
        "message": "Encuesta guardada correctamente.",
        "survey": survey
    }


@router.get("/my-responses")
def get_my_surveys(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = (
        select(SurveyResponse)
        .where(SurveyResponse.user_id == current_user.id)
        .order_by(SurveyResponse.created_at.desc())
    )

    surveys = session.exec(statement).all()

    return surveys