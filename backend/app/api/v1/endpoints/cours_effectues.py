from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.cahier_maitres import CoursEffectueCreate, CoursEffectueRead
from app.crud import cahier_maitres as crud

router = APIRouter()


@router.get("/", response_model=list[CoursEffectueRead])
def list_cours(id_enseignant: int = None, id_classe: int = None, db: Session = Depends(get_db)):
    return crud.get_cours_effectues(db, id_enseignant=id_enseignant, id_classe=id_classe)


@router.post("/", response_model=CoursEffectueRead, status_code=201)
def create_cours(data: CoursEffectueCreate, db: Session = Depends(get_db)):
    return crud.create_cours_effectue(db, data)