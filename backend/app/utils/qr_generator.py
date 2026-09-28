import uuid


def generer_token() -> str:
    return uuid.uuid4().hex


def generer_reference(prefixe: str, identifiant: int, longueur: int = 6) -> str:
    return f"{prefixe}-{identifiant:0{longueur}d}"


def generer_image_qr(contenu: str, chemin_sortie: str) -> str:
    import qrcode
    img = qrcode.make(contenu)
    img.save(chemin_sortie)
    return chemin_sortie