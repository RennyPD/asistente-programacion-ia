import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from app.core.config import settings
from app.db.database import get_session
from app.models.models import User

router = APIRouter()

# El esquema de tokens se mantiene igual
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ==========================================
# FUNCIONES DE SEGURIDAD (Nativas con bcrypt)
# ==========================================

def hash_password(password: str) -> str:
    # bcrypt requiere que el string se convierta a bytes (encode)
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    # Guardamos en la base de datos como string normal (decode)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        # Convertimos ambos strings a bytes para que bcrypt pueda compararlos
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = password_hash.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def build_auth_response(user: User) -> AuthResponse:
    access_token = create_access_token(data={"sub": str(user.id)})

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at
        )
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión del usuario.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = session.get(User, int(user_id))

    if user is None:
        raise credentials_exception

    return user


# ==========================================
# ENDPOINTS
# ==========================================

@router.post("/register", response_model=AuthResponse)
def register(
    request: RegisterRequest,
    session: Session = Depends(get_session)
):
    clean_email = request.email.lower().strip()
    clean_name = request.name.strip()

    if len(clean_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="El nombre debe tener al menos 2 caracteres."
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 6 caracteres."
        )

    statement = select(User).where(User.email == clean_email)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una cuenta registrada con este correo."
        )

    user = User(
        name=clean_name,
        email=clean_email,
        password_hash=hash_password(request.password)
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return build_auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    session: Session = Depends(get_session)
):
    clean_email = request.email.lower().strip()

    statement = select(User).where(User.email == clean_email)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos."
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos."
        )

    return build_auth_response(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at
    )