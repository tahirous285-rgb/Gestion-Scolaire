from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.administration import RoleCreate, RoleRead
from app.crud import administration as crud

router = APIRouter()


@router.get("/", response_model=list[RoleRead])
def list_roles(db: Session = Depends(get_db)):
    return crud.get_roles(db)


@router.post("/", response_model=RoleRead, status_code=201)
def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    return crud.create_role(db, data)