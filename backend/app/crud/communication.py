from sqlalchemy.orm import Session
from datetime import datetime
from app.models.communication import Annonce, Message, Notification
from app.schemas.communication import AnnonceCreate, MessageCreate, NotificationCreate


# ---------- ANNONCE ----------
def get_annonces(db: Session, id_etablissement: int = None):
    query = db.query(Annonce)
    if id_etablissement:
        query = query.filter(Annonce.id_etablissement == id_etablissement)
    return query.all()


def create_annonce(db: Session, data: AnnonceCreate):
    db_obj = Annonce(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- MESSAGE ----------
def get_messages(db: Session, id_destinataire: int = None, id_expediteur: int = None):
    query = db.query(Message)
    if id_destinataire:
        query = query.filter(Message.id_destinataire == id_destinataire)
    if id_expediteur:
        query = query.filter(Message.id_expediteur == id_expediteur)
    return query.all()


def create_message(db: Session, data: MessageCreate):
    db_obj = Message(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def marquer_message_lu(db: Session, id_message: int):
    db_obj = db.query(Message).filter(Message.id_message == id_message).first()
    if not db_obj:
        return None
    db_obj.lu = True
    db_obj.date_lecture = datetime.utcnow()
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ---------- NOTIFICATION ----------
def get_notifications(db: Session, id_utilisateur: int = None):
    query = db.query(Notification)
    if id_utilisateur:
        query = query.filter(Notification.id_utilisateur == id_utilisateur)
    return query.all()


def create_notification(db: Session, data: NotificationCreate):
    db_obj = Notification(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def marquer_notification_lue(db: Session, id_notification: int):
    db_obj = db.query(Notification).filter(Notification.id_notification == id_notification).first()
    if not db_obj:
        return None
    db_obj.lue = True
    db_obj.date_lecture = datetime.utcnow()
    db.commit()
    db.refresh(db_obj)
    return db_obj