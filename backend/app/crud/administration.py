from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from app.models.administration import Etablissement, Role, Permission, RolePermission, Utilisateur, Parametre, JournalActivite
from app.schemas.administration import (
    EtablissementCreate, EtablissementUpdate,
    RoleCreate, RoleUpdate,
    PermissionCreate, PermissionUpdate,
    UtilisateurCreate, UtilisateurUpdate,
    ParametreCreate, ParametreUpdate,
    JournalActiviteCreate
)
from app.core.security import hash_password


def _commit_or_conflict(db: Session, detail: str):
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail=detail) from error


# ---------- ETABLISSEMENT ----------
def get_etablissement(db: Session, id_etablissement: int):
    return db.query(Etablissement).filter(
        Etablissement.id_etablissement == id_etablissement
    ).first()


def get_etablissements(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Etablissement).offset(skip).limit(limit).all()


def create_etablissement(db: Session, data: EtablissementCreate):
    db_obj = Etablissement(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_etablissement(db: Session, id_etablissement: int, data: EtablissementUpdate):
    db_obj = get_etablissement(db, id_etablissement)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_etablissement(db: Session, id_etablissement: int):
    db_obj = get_etablissement(db, id_etablissement)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- ROLE ----------
def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Role).offset(skip).limit(limit).all()


def get_role(db: Session, id_role: int):
    return db.query(Role).filter(Role.id_role == id_role).first()


def create_role(db: Session, data: RoleCreate):
    db_obj = Role(**data.model_dump())
    db.add(db_obj)
    _commit_or_conflict(db, "Un rôle avec ce nom ou ce code existe déjà")
    db.refresh(db_obj)
    return db_obj


def update_role(db: Session, id_role: int, data: RoleUpdate):
    db_obj = get_role(db, id_role)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    _commit_or_conflict(db, "Un rôle avec ce nom ou ce code existe déjà")
    db.refresh(db_obj)
    return db_obj


def delete_role(db: Session, id_role: int):
    db_obj = get_role(db, id_role)
    if not db_obj:
        return None
    if db.query(Utilisateur.id_utilisateur).filter(Utilisateur.id_role == id_role).first():
        raise HTTPException(
            status_code=409,
            detail="Ce rôle est attribué à un ou plusieurs utilisateurs et ne peut pas être supprimé",
        )
    if db.query(RolePermission.id_role).filter(RolePermission.id_role == id_role).first():
        raise HTTPException(
            status_code=409,
            detail="Ce rôle possède des permissions associées et ne peut pas être supprimé",
        )
    db.delete(db_obj)
    _commit_or_conflict(db, "Ce rôle est encore utilisé et ne peut pas être supprimé")
    return db_obj


# ---------- PERMISSION ----------
def get_permissions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Permission).offset(skip).limit(limit).all()


def get_permission(db: Session, id_permission: int):
    return db.query(Permission).filter(Permission.id_permission == id_permission).first()


def create_permission(db: Session, data: PermissionCreate):
    db_obj = Permission(**data.model_dump())
    db.add(db_obj)
    _commit_or_conflict(db, "Une permission avec ce code existe déjà")
    db.refresh(db_obj)
    return db_obj


def update_permission(db: Session, id_permission: int, data: PermissionUpdate):
    db_obj = get_permission(db, id_permission)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    _commit_or_conflict(db, "Une permission avec ce code existe déjà")
    db.refresh(db_obj)
    return db_obj


def delete_permission(db: Session, id_permission: int):
    db_obj = get_permission(db, id_permission)
    if not db_obj:
        return None
    if db.query(RolePermission.id_permission).filter(
        RolePermission.id_permission == id_permission
    ).first():
        raise HTTPException(
            status_code=409,
            detail="Cette permission est associée à un ou plusieurs rôles et ne peut pas être supprimée",
        )
    db.delete(db_obj)
    _commit_or_conflict(db, "Cette permission est encore utilisée et ne peut pas être supprimée")
    return db_obj


# ---------- ROLE_PERMISSION ----------
def get_permissions_of_role(db: Session, id_role: int):
    if not get_role(db, id_role):
        raise HTTPException(status_code=404, detail="Rôle introuvable")
    return (
        db.query(Permission)
        .join(RolePermission, Permission.id_permission == RolePermission.id_permission)
        .filter(RolePermission.id_role == id_role)
        .all()
    )


def assign_permission_to_role(db: Session, id_role: int, id_permission: int):
    if not get_role(db, id_role):
        raise HTTPException(status_code=404, detail="Rôle introuvable")
    if not get_permission(db, id_permission):
        raise HTTPException(status_code=404, detail="Permission introuvable")

    existing = db.query(RolePermission).filter(
        RolePermission.id_role == id_role,
        RolePermission.id_permission == id_permission
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Cette permission est déjà associée à ce rôle")

    db_obj = RolePermission(id_role=id_role, id_permission=id_permission)
    db.add(db_obj)
    _commit_or_conflict(db, "Cette association existe déjà ou les ressources ne sont plus disponibles")
    return db_obj


def remove_permission_from_role(db: Session, id_role: int, id_permission: int):
    db_obj = db.query(RolePermission).filter(
        RolePermission.id_role == id_role,
        RolePermission.id_permission == id_permission
    ).first()
    if not db_obj:
        return None
    db.delete(db_obj)
    _commit_or_conflict(db, "Impossible de supprimer cette association")
    return db_obj


# ---------- UTILISATEUR ----------
def get_utilisateur(db: Session, id_utilisateur: int):
    return db.query(Utilisateur).filter(
        Utilisateur.id_utilisateur == id_utilisateur
    ).first()


def get_utilisateurs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Utilisateur).offset(skip).limit(limit).all()


def create_utilisateur(db: Session, data: UtilisateurCreate):
    payload = data.model_dump(exclude={"mot_de_passe"})
    payload["mot_de_passe_hash"] = hash_password(data.mot_de_passe)
    db_obj = Utilisateur(**payload)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_utilisateur(db: Session, id_utilisateur: int, data: UtilisateurUpdate):
    db_obj = get_utilisateur(db, id_utilisateur)
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_utilisateur(db: Session, id_utilisateur: int):
    db_obj = get_utilisateur(db, id_utilisateur)
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj


# ---------- PARAMETRE ----------
def get_parametres(db: Session, id_etablissement: int):
    return db.query(Parametre).filter(Parametre.id_etablissement == id_etablissement).all()


def create_parametre(db: Session, data: ParametreCreate):
    db_obj = Parametre(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_parametre(db: Session, id_parametre: int, data: ParametreUpdate):
    db_obj = db.query(Parametre).filter(Parametre.id_parametre == id_parametre).first()
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- JOURNAL_ACTIVITE ----------
def get_journal(db: Session, id_etablissement: int, limit: int = 20):
    return db.query(JournalActivite).filter(
        JournalActivite.id_etablissement == id_etablissement
    ).order_by(JournalActivite.date_action.desc()).limit(limit).all()


def create_journal_entry(db: Session, data: JournalActiviteCreate):
    db_obj = JournalActivite(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj