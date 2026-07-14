from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.db.database import create_db_and_tables, engine
from app.models.models import User, LearningPath, Topic
from app.routers import ai, learning_paths, progress, exercises, auth


app = FastAPI(
    title="CodeTutor AI UFHEC",
    description="Prototipo de plataforma inteligente para apoyo al aprendizaje autodidacta de programación.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_initial_data():
    with Session(engine) as session:
        user_statement = select(User).where(User.email == "demo@ufhec.edu.do")
        existing_user = session.exec(user_statement).first()

        if not existing_user:
            demo_user = User(
            name="Estudiante Demo",
            email="demo@ufhec.edu.do",
            password_hash=auth.hash_password("demo123")
            )
            session.add(demo_user)

        path_statement = select(LearningPath).where(
            LearningPath.title == "Fundamentos de Programación con Python"
        )
        existing_path = session.exec(path_statement).first()

        if existing_path:
            return

        python_path = LearningPath(
            title="Fundamentos de Programación con Python",
            description="Ruta inicial para aprender los conceptos básicos de programación usando Python.",
            level="Básico",
            language="Python"
        )

        session.add(python_path)
        session.commit()
        session.refresh(python_path)

        topics = [
            Topic(
                learning_path_id=python_path.id,
                title="Variables y tipos de datos",
                description="Aprende qué son las variables y cómo almacenar información en un programa.",
                objective="Comprender cómo declarar variables y utilizar tipos de datos básicos.",
                order_number=1
            ),
            Topic(
                learning_path_id=python_path.id,
                title="Condicionales",
                description="Aprende a tomar decisiones en un programa usando if, elif y else.",
                objective="Aplicar estructuras condicionales para controlar el flujo del programa.",
                order_number=2
            ),
            Topic(
                learning_path_id=python_path.id,
                title="Bucles",
                description="Aprende a repetir instrucciones usando for y while.",
                objective="Usar bucles para automatizar tareas repetitivas.",
                order_number=3
            ),
            Topic(
                learning_path_id=python_path.id,
                title="Funciones",
                description="Aprende a organizar tu código mediante funciones reutilizables.",
                objective="Crear funciones para dividir un programa en bloques más claros.",
                order_number=4
            ),
            Topic(
                learning_path_id=python_path.id,
                title="Listas",
                description="Aprende a almacenar varios valores en una misma estructura.",
                objective="Manipular colecciones de datos usando listas.",
                order_number=5
            ),
            Topic(
                learning_path_id=python_path.id,
                title="Diccionarios",
                description="Aprende a trabajar con datos organizados en pares clave-valor.",
                objective="Utilizar diccionarios para representar información estructurada.",
                order_number=6
            ),
            Topic(
                learning_path_id=python_path.id,
                title="Manejo de errores",
                description="Aprende a manejar errores usando try y except.",
                objective="Evitar que el programa se detenga inesperadamente ante errores.",
                order_number=7
            ),
            Topic(
                learning_path_id=python_path.id,
                title="Proyecto final básico",
                description="Aplica los conocimientos aprendidos en un pequeño proyecto práctico.",
                objective="Construir un programa sencillo integrando variables, condicionales, bucles y funciones.",
                order_number=8
            ),
        ]

        session.add_all(topics)
        session.commit()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_initial_data()


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backend de CodeTutor AI funcionando correctamente."
    }


app.include_router(ai.router, prefix="/api/ai", tags=["Inteligencia Artificial"])
app.include_router(learning_paths.router, prefix="/api/learning-paths", tags=["Rutas de aprendizaje"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progreso"])
app.include_router(exercises.router, prefix="/api/exercises", tags=["Ejercicios"])
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])