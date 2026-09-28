from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.cahier_maitres import ObservationEnseignantCreate, ObservationEnseignantRead
from app.crud import cahier_maitres as crud

router = APIRouter()


@router.get("/", response_model=list[ObservationEnseignantRead])
def list_observations(id_enseignant: int = None, db: Session = Depends(get_db)):
    return crud.get_observations(db, id_enseignant=id_enseignant)


@router.post("/", response_model=ObservationEnseignantRead, status_code=201)
def create_observation(data: ObservationEnseignantCreate, db: Session = Depends(get_db)):
    return crud.create_observation(db, data)