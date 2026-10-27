from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.cahier_maitres import ObservationEnseignantCreate, ObservationEnseignantUpdate, ObservationEnseignantRead
from app.crud import cahier_maitres as crud

router = APIRouter()


@router.get("/", response_model=list[ObservationEnseignantRead])
def list_observations(id_enseignant: int = None, db: Session = Depends(get_db)):
    return crud.get_observations(db, id_enseignant=id_enseignant)


@router.get("/{id_observation}", response_model=ObservationEnseignantRead)
def get_observation(id_observation: int, db: Session = Depends(get_db)):
    obj = crud.get_observation(db, id_observation)
    if not obj:
        raise HTTPException(status_code=404, detail="Observation introuvable")
    return obj


@router.post("/", response_model=ObservationEnseignantRead, status_code=201)
def create_observation(data: ObservationEnseignantCreate, db: Session = Depends(get_db)):
    return crud.create_observation(db, data)


@router.put("/{id_observation}", response_model=ObservationEnseignantRead)
def update_observation(id_observation: int, data: ObservationEnseignantUpdate, db: Session = Depends(get_db)):
    obj = crud.update_observation(db, id_observation, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Observation introuvable")
    return obj


@router.delete("/{id_observation}", status_code=204)
def delete_observation(id_observation: int, db: Session = Depends(get_db)):
    obj = crud.delete_observation(db, id_observation)
    if not obj:
        raise HTTPException(status_code=404, detail="Observation introuvable")