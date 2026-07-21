from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(
        index=True,
        unique=True,
        max_length=255,
    )
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=utc_now)


class LearningPath(SQLModel, table=True):
    __tablename__ = "learning_paths"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, unique=True, max_length=200)
    description: str
    level: str = Field(max_length=50)
    language: str = Field(max_length=50)
    created_at: datetime = Field(default_factory=utc_now)


class Topic(SQLModel, table=True):
    __tablename__ = "topics"

    id: Optional[int] = Field(default=None, primary_key=True)
    learning_path_id: int = Field(
        foreign_key="learning_paths.id",
        index=True,
    )
    title: str = Field(max_length=200)
    description: str
    order_number: int = Field(ge=1)
    objective: str
    created_at: datetime = Field(default_factory=utc_now)


class Exercise(SQLModel, table=True):
    __tablename__ = "exercises"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
    )
    topic_id: int = Field(
        foreign_key="topics.id",
        index=True,
    )
    title: str = Field(max_length=200)
    description: str
    difficulty: str = Field(max_length=50)
    language: str = Field(max_length=50)
    expected_solution: Optional[str] = None
    created_by_ai: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utc_now)


class Progress(SQLModel, table=True):
    __tablename__ = "progress"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
    )
    topic_id: int = Field(
        foreign_key="topics.id",
        index=True,
    )
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None


class ChatHistory(SQLModel, table=True):
    __tablename__ = "chat_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
    )
    message: str
    response: str
    created_at: datetime = Field(default_factory=utc_now)


class Submission(SQLModel, table=True):
    __tablename__ = "submissions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
    )
    topic_id: int = Field(
        foreign_key="topics.id",
        index=True,
    )
    exercise: str
    code: str
    ai_feedback: str
    score: Optional[int] = Field(
        default=None,
        ge=0,
        le=100,
    )
    created_at: datetime = Field(default_factory=utc_now)


class AssessmentResult(SQLModel, table=True):
    __tablename__ = "assessment_results"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
    )
    topic_id: int = Field(
        foreign_key="topics.id",
        index=True,
    )
    total_questions: int = Field(ge=1)
    correct_answers: int = Field(ge=0)
    score: int = Field(ge=0, le=100)
    answers_json: str
    feedback: str
    created_at: datetime = Field(default_factory=utc_now)


class SurveyResponse(SQLModel, table=True):
    __tablename__ = "survey_responses"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
    )
    usefulness: int = Field(ge=1, le=5)
    ease_of_use: int = Field(ge=1, le=5)
    ai_support: int = Field(ge=1, le=5)
    recommendation: int = Field(ge=1, le=5)
    favorite_feature: str = Field(max_length=200)
    comments: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)