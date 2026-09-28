from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.finance import DepenseCreate, DepenseRead
from app.crud import finance as crud

router = APIRouter()


@router.get("/", response_model=list[DepenseRead])
def list_depenses(id_etablissement: int = None, db: Session = Depends(get_db)):
    return crud.get_depenses(db, id_etablissement=id_etablissement)


@router.post("/", response_model=DepenseRead, status_code=201)
def create_depense(data: DepenseCreate, db: Session = Depends(get_db)):
    return crud.create_depense(db, data)