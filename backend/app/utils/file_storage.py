import os
import shutil
import uuid

BASE_STORAGE_DIR = "storage"


def _chemin_complet(sous_dossier: str, nom_fichier: str) -> str:
    dossier = os.path.join(BASE_STORAGE_DIR, sous_dossier)
    os.makedirs(dossier, exist_ok=True)
    return os.path.join(dossier, nom_fichier)


def sauvegarder_fichier(contenu: bytes, sous_dossier: str, extension: str) -> str:
    """
    Sauvegarde un fichier binaire (photo d'élève, justificatif...) dans
    storage/<sous_dossier>/ avec un nom unique. Retourne le chemin créé.
    """
    nom_fichier = f"{uuid.uuid4().hex}.{extension.lstrip('.')}"
    chemin = _chemin_complet(sous_dossier, nom_fichier)
    with open(chemin, "wb") as f:
        f.write(contenu)
    return chemin


def supprimer_fichier(chemin: str) -> bool:
    """
    Supprime un fichier du stockage local s'il existe.
    """
    if chemin and os.path.exists(chemin):
        os.remove(chemin)
        return True
    return False


def copier_fichier(chemin_source: str, sous_dossier: str) -> str:
    """
    Copie un fichier existant vers le dossier de stockage.
    """
    extension = os.path.splitext(chemin_source)[1].lstrip(".")
    nom_fichier = f"{uuid.uuid4().hex}.{extension}"
    destination = _chemin_complet(sous_dossier, nom_fichier)
    shutil.copy(chemin_source, destination)
    return destination