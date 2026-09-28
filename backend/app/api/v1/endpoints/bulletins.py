from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.pedagogie import BulletinCreate, BulletinUpdate, BulletinRead
from app.crud import pedagogie as crud

router = APIRouter()


@router.get("/", response_model=list[BulletinRead])
def list_bulletins(id_inscription: int = None, id_periode: int = None, db: Session = Depends(get_db)):
    return crud.get_bulletins(db, id_inscription=id_inscription, id_periode=id_periode)


@router.get("/{id_bulletin}", response_model=BulletinRead)
def get_bulletin(id_bulletin: int, db: Session = Depends(get_db)):
    obj = crud.get_bulletin(db, id_bulletin)
    if not obj:
        raise HTTPException(status_code=404, detail="Bulletin introuvable")
    return obj


@router.post("/", response_model=BulletinRead, status_code=201)
def create_bulletin(data: BulletinCreate, db: Session = Depends(get_db)):
    return crud.create_bulletin(db, data)


@router.put("/{id_bulletin}", response_model=BulletinRead)
def update_bulletin(id_bulletin: int, data: BulletinUpdate, db: Session = Depends(get_db)):
    obj = crud.update_bulletin(db, id_bulletin, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Bulletin introuvable")
    return obj


@router.put("/{id_bulletin}/generer-pdf", response_model=BulletinRead)
def generer_pdf(id_bulletin: int, db: Session = Depends(get_db)):
    obj = crud.generer_pdf_bulletin(db, id_bulletin)
    if not obj:
        raise HTTPException(status_code=404, detail="Bulletin introuvable")
    return obj