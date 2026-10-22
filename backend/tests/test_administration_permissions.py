import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.api import api_router
from app.api.v1.endpoints.auth import login, register
from app.api.v1.endpoints.permissions import router as permissions_router
from app.core.database import Base
from app.core.dependencies import get_current_user
from app.crud import administration as administration_crud
from app.models.administration import (
    Etablissement,
    Permission,
    Role,
    RolePermission,
    Utilisateur,
)
from app.schemas.administration import PermissionCreate, RoleCreate
from app.schemas.auth import LoginRequest, RegistrationRequest
from app.services.auth_service import authenticate_user


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def role_and_permission(db):
    role = Role(nom="Gestionnaire", code="GEST")
    permission = Permission(nom="Lire les élèves", code="ELEVE_LECTURE")
    db.add_all([role, permission])
    db.commit()
    return role, permission


def test_assignment_checks_resources_and_prevents_duplicates(db, role_and_permission):
    role, permission = role_and_permission

    association = administration_crud.assign_permission_to_role(
        db, role.id_role, permission.id_permission
    )
    assert association.id_role == role.id_role
    assert [
        item.id_permission
        for item in administration_crud.get_permissions_of_role(db, role.id_role)
    ] == [permission.id_permission]

    with pytest.raises(HTTPException) as duplicate:
        administration_crud.assign_permission_to_role(
            db, role.id_role, permission.id_permission
        )
    assert duplicate.value.status_code == 409

    with pytest.raises(HTTPException) as missing_role:
        administration_crud.assign_permission_to_role(
            db, 999, permission.id_permission
        )
    assert missing_role.value.status_code == 404

    with pytest.raises(HTTPException) as missing_permission:
        administration_crud.assign_permission_to_role(db, role.id_role, 999)
    assert missing_permission.value.status_code == 404


def test_deleting_used_permission_or_role_is_rejected(db, role_and_permission):
    role, permission = role_and_permission
    db.add(RolePermission(id_role=role.id_role, id_permission=permission.id_permission))
    db.commit()

    with pytest.raises(HTTPException) as permission_conflict:
        administration_crud.delete_permission(db, permission.id_permission)
    assert permission_conflict.value.status_code == 409

    with pytest.raises(HTTPException) as role_conflict:
        administration_crud.delete_role(db, role.id_role)
    assert role_conflict.value.status_code == 409


def test_deleting_role_assigned_to_user_is_rejected(db):
    school = Etablissement(nom="École", code="ECOLE")
    role = Role(nom="Gestionnaire", code="GEST")
    db.add_all([school, role])
    db.flush()
    user = Utilisateur(
        id_etablissement=school.id_etablissement,
        id_role=role.id_role,
        nom="Test",
        prenom="Utilisateur",
        email="test@example.test",
        login="test",
        mot_de_passe_hash="hash",
    )
    db.add(user)
    db.commit()

    with pytest.raises(HTTPException) as conflict:
        administration_crud.delete_role(db, role.id_role)
    assert conflict.value.status_code == 409


def test_duplicate_role_and_permission_codes_return_conflict(db, role_and_permission):
    with pytest.raises(HTTPException) as role_conflict:
        administration_crud.create_role(
            db, RoleCreate(nom="Autre gestionnaire", code="GEST")
        )
    assert role_conflict.value.status_code == 409

    with pytest.raises(HTTPException) as permission_conflict:
        administration_crud.create_permission(
            db,
            PermissionCreate(nom="Autre permission", code="ELEVE_LECTURE"),
        )
    assert permission_conflict.value.status_code == 409


def test_fixed_permission_routes_precede_dynamic_id_route():
    get_paths = [
        route.path
        for route in permissions_router.routes
        if "GET" in route.methods
    ]
    assert get_paths.index("/role/{id_role}") < get_paths.index("/{id_permission}")


def test_permission_endpoints_remain_registered_with_authentication():
    permission_routes = [
        route
        for route in api_router.routes
        if route.path.startswith("/permissions")
    ]
    assert permission_routes
    assert all(
        any(dependency.call is get_current_user for dependency in route.dependant.dependencies)
        for route in permission_routes
    )


def test_registration_endpoint_is_public():
    registration_routes = [
        route
        for route in api_router.routes
        if route.path == "/auth/register" and "POST" in route.methods
    ]
    assert len(registration_routes) == 1
    assert not any(
        dependency.call is get_current_user
        for dependency in registration_routes[0].dependant.dependencies
    )


def test_registration_creates_school_and_admin_account(db):
    data = RegistrationRequest(
        nom_etablissement="École Exemple",
        nom="Diallo",
        prenom="Awa",
        email="awa@example.com",
        mot_de_passe="MotDePasseSecurise123",
    )

    result = register(data, db)

    user = authenticate_user(
        db,
        str(data.email),
        data.mot_de_passe,
    )
    assert result.id_etablissement == 1
    assert result.id_utilisateur == user.id_utilisateur
    assert user.role.code == "ADMIN_ETABLISSEMENT"

    token = login(
        LoginRequest(email=str(data.email), mot_de_passe=data.mot_de_passe),
        db,
    )
    assert token.id_etablissement == result.id_etablissement
    assert token.id_utilisateur == user.id_utilisateur

    with pytest.raises(HTTPException) as duplicate_email:
        register(
            RegistrationRequest(
                nom_etablissement="Autre école",
                nom="Diallo",
                prenom="Awa",
                email="awa@example.com",
                mot_de_passe="MotDePasseSecurise123",
            ),
            db,
        )
    assert duplicate_email.value.status_code == 409
