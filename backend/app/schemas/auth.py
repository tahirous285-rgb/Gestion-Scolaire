from pydantic import BaseModel


class LoginRequest(BaseModel):
    id_etablissement: int
    login: str
    mot_de_passe: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id_utilisateur: int
    nom: str
    prenom: str
    id_role: int