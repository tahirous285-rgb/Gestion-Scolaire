from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import authenticate_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.id_etablissement, data.login, data.mot_de_passe)
    if not user:
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    token = create_access_token({
        "sub": str(user.id_utilisateur),
        "id_etablissement": user.id_etablissement,
        "id_role": user.id_role
    })

    return TokenResponse(
        access_token=token,
        id_utilisateur=user.id_utilisateur,
        nom=user.nom,
        prenom=user.prenom,
        id_role=user.id_role
    )