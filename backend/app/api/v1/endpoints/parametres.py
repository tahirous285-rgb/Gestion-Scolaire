from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.administration import ParametreCreate, ParametreUpdate, ParametreRead
from app.crud import administration as crud

router = APIRouter()


@router.get("/", response_model=list[ParametreRead])
def list_parametres(id_etablissement: int, db: Session = Depends(get_db)):
    return crud.get_parametres(db, id_etablissement)


@router.post("/", response_model=ParametreRead, status_code=201)
def create_parametre(data: ParametreCreate, db: Session = Depends(get_db)):
    return crud.create_parametre(db, data)


@router.put("/{id_parametre}", response_model=ParametreRead)
def update_parametre(id_parametre: int, data: ParametreUpdate, db: Session = Depends(get_db)):
    obj = crud.update_parametre(db, id_parametre, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Paramètre introuvable")
    return obj