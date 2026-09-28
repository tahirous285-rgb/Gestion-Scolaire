from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.cahier_maitres import PresenceEnseignantCreate, PresenceEnseignantUpdate, PresenceEnseignantRead
from app.crud import cahier_maitres as crud

router = APIRouter()


@router.get("/", response_model=list[PresenceEnseignantRead])
def list_presences(id_enseignant: int = None, db: Session = Depends(get_db)):
    return crud.get_presences_enseignant(db, id_enseignant=id_enseignant)


@router.post("/", response_model=PresenceEnseignantRead, status_code=201)
def create_presence(data: PresenceEnseignantCreate, db: Session = Depends(get_db)):
    return crud.create_presence_enseignant(db, data)


@router.put("/{id_presence}", response_model=PresenceEnseignantRead)
def update_presence(id_presence: int, data: PresenceEnseignantUpdate, db: Session = Depends(get_db)):
    obj = crud.update_presence_enseignant(db, id_presence, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Présence introuvable")
    return obj