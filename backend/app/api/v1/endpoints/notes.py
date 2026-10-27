from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.pedagogie import NoteCreate, NoteUpdate, NoteRead, NoteSaisieRequest, NoteSaisieResponse
from app.crud import pedagogie as crud

router = APIRouter()


@router.get("/", response_model=list[NoteRead])
def list_notes(
    id_evaluation: int = None,
    id_inscription: int = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=1000, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_notes(
        db,
        id_evaluation=id_evaluation,
        id_inscription=id_inscription,
        skip=skip,
        limit=limit,
    )


@router.put("/evaluation/{id_evaluation}/saisie", response_model=NoteSaisieResponse)
def save_evaluation_notes(
    id_evaluation: int,
    data: NoteSaisieRequest,
    db: Session = Depends(get_db),
):
    return crud.enregistrer_saisie_notes(db, id_evaluation, data)


@router.get("/{id_note}", response_model=NoteRead)
def get_note(id_note: int, db: Session = Depends(get_db)):
    obj = crud.get_note(db, id_note)
    if not obj:
        raise HTTPException(status_code=404, detail="Note introuvable")
    return obj


@router.post("/", response_model=NoteRead, status_code=201)
def create_note(data: NoteCreate, db: Session = Depends(get_db)):
    return crud.create_note(db, data)


@router.put("/{id_note}", response_model=NoteRead)
def update_note(id_note: int, data: NoteUpdate, db: Session = Depends(get_db)):
    obj = crud.update_note(db, id_note, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Note introuvable")
    return obj


@router.delete("/{id_note}", status_code=204)
def delete_note(id_note: int, db: Session = Depends(get_db)):
    obj = crud.delete_note(db, id_note)
    if not obj:
        raise HTTPException(status_code=404, detail="Note introuvable")