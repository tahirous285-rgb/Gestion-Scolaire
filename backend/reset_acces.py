from getpass import getpass
from sqlalchemy import func

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.administration import Etablissement, Utilisateur


db = SessionLocal()

try:
    # Afficher les établissements et les comptes de connexion.
    comptes = (
        db.query(Utilisateur, Etablissement)
        .join(
            Etablissement,
            Etablissement.id_etablissement
            == Utilisateur.id_etablissement,
        )
        .order_by(
            Etablissement.id_etablissement,
            Utilisateur.id_utilisateur,
        )
        .all()
    )

    print("\n=== COMPTES ENREGISTRÉS ===")

    for utilisateur, etablissement in comptes:
        print(
            f"ID établissement : {etablissement.id_etablissement}"
            f" | Établissement : {etablissement.nom}"
            f" | E-mail établissement : {etablissement.email or 'Non renseigné'}"
            f" | E-mail de connexion : {utilisateur.email}"
            f" | Statut : {utilisateur.statut}"
        )

    if not comptes:
        print("Aucun compte trouvé dans la base configurée.")
        raise SystemExit(1)

    email = input(
        "\nAdresse e-mail du compte à réinitialiser : "
    ).strip().lower()

    utilisateurs = (
        db.query(Utilisateur)
        .filter(func.lower(Utilisateur.email) == email)
        .all()
    )

    if len(utilisateurs) == 0:
        print("Aucun compte trouvé avec cette adresse e-mail.")
        raise SystemExit(1)

    if len(utilisateurs) > 1:
        print(
            "Plusieurs comptes utilisent cette adresse. "
            "Réinitialisation annulée pour éviter une erreur."
        )
        raise SystemExit(1)

    utilisateur = utilisateurs[0]

    nouveau_mdp = getpass("Nouveau mot de passe : ")
    confirmation = getpass("Confirmer le mot de passe : ")

    if nouveau_mdp != confirmation:
        print("Les mots de passe ne correspondent pas.")
        raise SystemExit(1)

    if not 8 <= len(nouveau_mdp) <= 72:
        print("Le mot de passe doit contenir entre 8 et 72 caractères.")
        raise SystemExit(1)

    utilisateur.mot_de_passe_hash = hash_password(nouveau_mdp)
    db.commit()

    print("\nMot de passe réinitialisé avec succès.")
    print(f"Adresse de connexion : {utilisateur.email}")
    print("Utilise le nouveau mot de passe que tu viens de saisir.")

except Exception:
    db.rollback()
    raise

finally:
    db.close()