from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.administration import RoleCreate, RoleUpdate, RoleRead
from app.crud import administration as crud

router = APIRouter()


@router.get("/", response_model=list[RoleRead])
def list_roles(db: Session = Depends(get_db)):
    return crud.get_roles(db)


@router.get("/{id_role}", response_model=RoleRead)
def get_role(id_role: int, db: Session = Depends(get_db)):
    obj = crud.get_role(db, id_role)
    if not obj:
        raise HTTPException(status_code=404, detail="Rôle introuvable")
    return obj


@router.post("/", response_model=RoleRead, status_code=201)
def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    return crud.create_role(db, data)


@router.put("/{id_role}", response_model=RoleRead)
def update_role(id_role: int, data: RoleUpdate, db: Session = Depends(get_db)):
    obj = crud.update_role(db, id_role, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Rôle introuvable")
    return obj


@router.delete("/{id_role}", status_code=204)
def delete_role(id_role: int, db: Session = Depends(get_db)):
    obj = crud.delete_role(db, id_role)
    if not obj:
        raise HTTPException(status_code=404, detail="Rôle introuvable")