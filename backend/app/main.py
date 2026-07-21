from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.core.config import settings
from app.db.database import create_db_and_tables, engine
from app.models.models import LearningPath, Topic, User
from app.routers import (
    ai,
    assessments,
    auth,
    chat,
    exercises,
    learning_paths,
    progress,
    surveys,
)


def seed_initial_data() -> None:
    """
    Crea los datos iniciales de la aplicación sin duplicarlos.

    Esta función puede ejecutarse varias veces de forma segura:
    - Solo crea el usuario demo si no existe.
    - Solo crea la ruta de Python si no existe.
    - Solo crea los temas cuando crea la ruta.
    """
    with Session(engine) as session:
        seed_user(session)
        seed_python_learning_path(session)


def seed_user(session: Session) -> None:
    user_statement = select(User).where(
        User.email == "demo@ufhec.edu.do"
    )
    existing_user = session.exec(user_statement).first()

    if existing_user:
        return

    demo_user = User(
        name="Estudiante Demo",
        email="demo@ufhec.edu.do",
        password_hash=auth.hash_password("demo123"),
    )

    session.add(demo_user)
    session.commit()


def seed_python_learning_path(session: Session) -> None:
    path_title = "Fundamentos de Programación con Python"

    path_statement = select(LearningPath).where(
        LearningPath.title == path_title
    )
    existing_path = session.exec(path_statement).first()

    if existing_path:
        return

    python_path = LearningPath(
        title=path_title,
        description=(
            "Ruta inicial para aprender los conceptos básicos "
            "de programación usando Python."
        ),
        level="Básico",
        language="Python",
    )

    session.add(python_path)
    session.commit()
    session.refresh(python_path)

    if python_path.id is None:
        raise RuntimeError(
            "No se pudo obtener el ID de la ruta de aprendizaje."
        )

    topics_data = [
        {
            "title": "Variables y tipos de datos",
            "description": (
                "Aprende qué son las variables y cómo almacenar "
                "información en un programa."
            ),
            "objective": (
                "Comprender cómo declarar variables y utilizar "
                "tipos de datos básicos."
            ),
        },
        {
            "title": "Condicionales",
            "description": (
                "Aprende a tomar decisiones en un programa "
                "usando if, elif y else."
            ),
            "objective": (
                "Aplicar estructuras condicionales para controlar "
                "el flujo del programa."
            ),
        },
        {
            "title": "Bucles",
            "description": (
                "Aprende a repetir instrucciones usando for y while."
            ),
            "objective": (
                "Usar bucles para automatizar tareas repetitivas."
            ),
        },
        {
            "title": "Funciones",
            "description": (
                "Aprende a organizar tu código mediante "
                "funciones reutilizables."
            ),
            "objective": (
                "Crear funciones para dividir un programa "
                "en bloques más claros."
            ),
        },
        {
            "title": "Listas",
            "description": (
                "Aprende a almacenar varios valores en una "
                "misma estructura."
            ),
            "objective": (
                "Manipular colecciones de datos usando listas."
            ),
        },
        {
            "title": "Diccionarios",
            "description": (
                "Aprende a trabajar con datos organizados "
                "en pares clave-valor."
            ),
            "objective": (
                "Utilizar diccionarios para representar "
                "información estructurada."
            ),
        },
        {
            "title": "Manejo de errores",
            "description": (
                "Aprende a manejar errores usando try y except."
            ),
            "objective": (
                "Evitar que el programa se detenga "
                "inesperadamente ante errores."
            ),
        },
        {
            "title": "Proyecto final básico",
            "description": (
                "Aplica los conocimientos aprendidos en un "
                "pequeño proyecto práctico."
            ),
            "objective": (
                "Construir un programa sencillo integrando variables, "
                "condicionales, bucles y funciones."
            ),
        },
    ]

    topics = [
        Topic(
            learning_path_id=python_path.id,
            title=topic_data["title"],
            description=topic_data["description"],
            objective=topic_data["objective"],
            order_number=index,
        )
        for index, topic_data in enumerate(topics_data, start=1)
    ]

    session.add_all(topics)
    session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_initial_data()
    yield


app = FastAPI(
    title="CodeTutor AI UFHEC",
    description=(
        "Prototipo de plataforma inteligente para apoyo al "
        "aprendizaje autodidacta de programación."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


allowed_origins = list(
    {
        origin
        for origin in [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://asistente-programacion-ia.vercel.app",
            settings.FRONTEND_URL,
        ]
        if origin
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "API de CodeTutor AI UFHEC.",
        "documentation": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": (
            "Backend de CodeTutor AI funcionando correctamente."
        ),
    }


app.include_router(
    ai.router,
    prefix="/api/ai",
    tags=["Inteligencia Artificial"],
)

app.include_router(
    learning_paths.router,
    prefix="/api/learning-paths",
    tags=["Rutas de aprendizaje"],
)

app.include_router(
    progress.router,
    prefix="/api/progress",
    tags=["Progreso"],
)

app.include_router(
    exercises.router,
    prefix="/api/exercises",
    tags=["Ejercicios"],
)

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Autenticación"],
)

app.include_router(
    chat.router,
    prefix="/api/chat",
    tags=["Chat inteligente"],
)

app.include_router(
    assessments.router,
    prefix="/api/assessments",
    tags=["Autoevaluaciones"],
)

app.include_router(
    surveys.router,
    prefix="/api/surveys",
    tags=["Encuesta de percepción"],
)