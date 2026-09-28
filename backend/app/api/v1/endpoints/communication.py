from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.communication import (
    AnnonceCreate, AnnonceRead,
    MessageCreate, MessageRead,
    NotificationCreate, NotificationRead
)
from app.crud import communication as crud

router = APIRouter()


# ---------- ANNONCES ----------
@router.get("/annonces", response_model=list[AnnonceRead])
def list_annonces(id_etablissement: int = None, db: Session = Depends(get_db)):
    return crud.get_annonces(db, id_etablissement=id_etablissement)


@router.post("/annonces", response_model=AnnonceRead, status_code=201)
def create_annonce(data: AnnonceCreate, db: Session = Depends(get_db)):
    return crud.create_annonce(db, data)


# ---------- MESSAGES ----------
@router.get("/messages", response_model=list[MessageRead])
def list_messages(id_destinataire: int = None, id_expediteur: int = None, db: Session = Depends(get_db)):
    return crud.get_messages(db, id_destinataire=id_destinataire, id_expediteur=id_expediteur)


@router.post("/messages", response_model=MessageRead, status_code=201)
def create_message(data: MessageCreate, db: Session = Depends(get_db)):
    return crud.create_message(db, data)


@router.put("/messages/{id_message}/lire", response_model=MessageRead)
def marquer_lu(id_message: int, db: Session = Depends(get_db)):
    obj = crud.marquer_message_lu(db, id_message)
    if not obj:
        raise HTTPException(status_code=404, detail="Message introuvable")
    return obj


# ---------- NOTIFICATIONS ----------
@router.get("/notifications", response_model=list[NotificationRead])
def list_notifications(id_utilisateur: int = None, db: Session = Depends(get_db)):
    return crud.get_notifications(db, id_utilisateur=id_utilisateur)


@router.post("/notifications", response_model=NotificationRead, status_code=201)
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    return crud.create_notification(db, data)


@router.put("/notifications/{id_notification}/lire", response_model=NotificationRead)
def marquer_notification_lue(id_notification: int, db: Session = Depends(get_db)):
    obj = crud.marquer_notification_lue(db, id_notification)
    if not obj:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return obj