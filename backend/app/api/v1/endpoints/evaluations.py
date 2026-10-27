from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.pedagogie import EvaluationCreate, EvaluationRead
from app.crud import pedagogie as crud

router = APIRouter()


@router.get("/", response_model=list[EvaluationRead])
def list_evaluations(
    id_annee: int = None,
    id_classe: int = None,
    id_matiere: int = None,
    id_enseignant: int = None,
    id_periode: int = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=1000, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_evaluations(
        db,
        id_annee=id_annee,
        id_classe=id_classe,
        id_matiere=id_matiere,
        id_enseignant=id_enseignant,
        id_periode=id_periode,
        skip=skip,
        limit=limit,
    )


@router.get("/{id_evaluation}", response_model=EvaluationRead)
def get_evaluation(id_evaluation: int, db: Session = Depends(get_db)):
    obj = crud.get_evaluation(db, id_evaluation)
    if not obj:
        raise HTTPException(status_code=404, detail="Évaluation introuvable")
    return obj


@router.post("/", response_model=EvaluationRead, status_code=201)
def create_evaluation(data: EvaluationCreate, db: Session = Depends(get_db)):
    return crud.create_evaluation(db, data)