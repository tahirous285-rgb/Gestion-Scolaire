from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str


class RegistrationRequest(BaseModel):
    nom_etablissement: str = Field(min_length=2, max_length=200)
    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    email: EmailStr
    mot_de_passe: str = Field(min_length=8, max_length=72)


class RegistrationResponse(BaseModel):
    id_etablissement: int
    id_utilisateur: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id_etablissement: int
    id_utilisateur: int
    nom: str
    prenom: str
    id_role: int