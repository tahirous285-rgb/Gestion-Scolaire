from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.administration import (
    PermissionCreate, PermissionUpdate, PermissionRead,
    RolePermissionAssign
)
from app.crud import administration as crud

router = APIRouter()


@router.get("/", response_model=list[PermissionRead])
def list_permissions(db: Session = Depends(get_db)):
    return crud.get_permissions(db)


@router.post("/", response_model=PermissionRead, status_code=201)
def create_permission(data: PermissionCreate, db: Session = Depends(get_db)):
    return crud.create_permission(db, data)


@router.get("/role/{id_role}", response_model=list[PermissionRead])
def get_permissions_of_role(id_role: int, db: Session = Depends(get_db)):
    return crud.get_permissions_of_role(db, id_role)


@router.post("/assign", status_code=201)
def assign_permission(data: RolePermissionAssign, db: Session = Depends(get_db)):
    crud.assign_permission_to_role(db, data.id_role, data.id_permission)
    return {"detail": "Permission associée avec succès"}


@router.delete("/assign/{id_role}/{id_permission}", status_code=204)
def remove_permission(id_role: int, id_permission: int, db: Session = Depends(get_db)):
    obj = crud.remove_permission_from_role(db, id_role, id_permission)
    if not obj:
        raise HTTPException(status_code=404, detail="Association introuvable")


@router.get("/{id_permission}", response_model=PermissionRead)
def get_permission(id_permission: int, db: Session = Depends(get_db)):
    obj = crud.get_permission(db, id_permission)
    if not obj:
        raise HTTPException(status_code=404, detail="Permission introuvable")
    return obj


@router.put("/{id_permission}", response_model=PermissionRead)
def update_permission(id_permission: int, data: PermissionUpdate, db: Session = Depends(get_db)):
    obj = crud.update_permission(db, id_permission, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Permission introuvable")
    return obj


@router.delete("/{id_permission}", status_code=204)
def delete_permission(id_permission: int, db: Session = Depends(get_db)):
    obj = crud.delete_permission(db, id_permission)
    if not obj:
        raise HTTPException(status_code=404, detail="Permission introuvable")