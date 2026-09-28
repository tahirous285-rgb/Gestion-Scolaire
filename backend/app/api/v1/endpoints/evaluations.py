from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.pedagogie import EvaluationCreate, EvaluationRead
from app.crud import pedagogie as crud

router = APIRouter()


@router.get("/", response_model=list[EvaluationRead])
def list_evaluations(id_classe: int = None, id_periode: int = None, db: Session = Depends(get_db)):
    return crud.get_evaluations(db, id_classe=id_classe, id_periode=id_periode)


@router.get("/{id_evaluation}", response_model=EvaluationRead)
def get_evaluation(id_evaluation: int, db: Session = Depends(get_db)):
    obj = crud.get_evaluation(db, id_evaluation)
    if not obj:
        raise HTTPException(status_code=404, detail="Évaluation introuvable")
    return obj


@router.post("/", response_model=EvaluationRead, status_code=201)
def create_evaluation(data: EvaluationCreate, db: Session = Depends(get_db)):
    return crud.create_evaluation(db, data)