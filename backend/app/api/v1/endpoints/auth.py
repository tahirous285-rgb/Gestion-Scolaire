from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from uuid import uuid4
from app.core.dependencies import get_db
from app.core.security import create_access_token, hash_password
from app.models.administration import Etablissement, Role, Utilisateur
from app.schemas.auth import LoginRequest, RegistrationRequest, RegistrationResponse, TokenResponse
from app.services.auth_service import authenticate_user

router = APIRouter()


@router.post("/register", response_model=RegistrationResponse, status_code=201)
def register(data: RegistrationRequest, db: Session = Depends(get_db)):
    normalized_email = str(data.email).strip().lower()
    existing_email = db.query(Utilisateur.id_utilisateur).filter(
        func.lower(Utilisateur.email) == normalized_email
    ).first()
    if existing_email:
        raise HTTPException(status_code=409, detail="Cette adresse e-mail est déjà utilisée")

    role = db.query(Role).filter(Role.code == "ADMIN_ETABLISSEMENT").first()
    if role is None:
        role = Role(
            nom="Administrateur d'établissement",
            code="ADMIN_ETABLISSEMENT",
            description="Administrateur de l'établissement",
        )
        db.add(role)

    etablissement = Etablissement(
        nom=data.nom_etablissement.strip(),
        code=f"ECOLE-{uuid4().hex[:12].upper()}",
    )
    db.add(etablissement)

    try:
        db.flush()
        utilisateur = Utilisateur(
            id_etablissement=etablissement.id_etablissement,
            id_role=role.id_role,
            nom=data.nom.strip(),
            prenom=data.prenom.strip(),
            email=normalized_email,
            login=normalized_email,
            mot_de_passe_hash=hash_password(data.mot_de_passe),
            statut="actif",
        )
        db.add(utilisateur)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cette adresse e-mail est déjà utilisée. La création de l’établissement a échoué.",
        ) from error

    db.refresh(etablissement)
    db.refresh(utilisateur)
    return RegistrationResponse(
        id_etablissement=etablissement.id_etablissement,
        id_utilisateur=utilisateur.id_utilisateur,
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, str(data.email), data.mot_de_passe)
    if not user:
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    token = create_access_token({
        "sub": str(user.id_utilisateur),
        "id_etablissement": user.id_etablissement,
        "id_role": user.id_role
    })

    return TokenResponse(
        access_token=token,
        id_etablissement=user.id_etablissement,
        id_utilisateur=user.id_utilisateur,
        nom=user.nom,
        prenom=user.prenom,
        id_role=user.id_role
    )