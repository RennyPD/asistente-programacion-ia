from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LearningPath(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    level: str
    language: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Topic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    learning_path_id: int = Field(foreign_key="learningpath.id")
    title: str
    description: str
    order_number: int
    objective: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    topic_id: int = Field(foreign_key="topic.id")
    title: str
    description: str
    difficulty: str
    language: str
    expected_solution: Optional[str] = None
    created_by_ai: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Progress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    topic_id: int = Field(foreign_key="topic.id")
    completed: bool = False
    completed_at: Optional[datetime] = None


class ChatHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    message: str
    response: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    topic_id: int = Field(foreign_key="topic.id")
    exercise: str
    code: str
    ai_feedback: str
    score: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)