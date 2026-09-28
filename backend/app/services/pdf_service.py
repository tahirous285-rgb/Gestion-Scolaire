import os

STORAGE_DIR = "storage"


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def generer_pdf_recu(numero_recu: str, montant: float, date_emission, nom_etablissement: str = "") -> str:
    from fpdf import FPDF

    dossier = os.path.join(STORAGE_DIR, "recus")
    _ensure_dir(dossier)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, nom_etablissement or "Reçu de paiement", ln=True, align="C")
    pdf.set_font("Helvetica", "", 12)
    pdf.ln(10)
    pdf.cell(0, 8, f"Numero de recu : {numero_recu}", ln=True)
    pdf.cell(0, 8, f"Montant : {montant} FCFA", ln=True)
    pdf.cell(0, 8, f"Date d'emission : {date_emission}", ln=True)

    chemin = os.path.join(dossier, f"{numero_recu}.pdf")
    pdf.output(chemin)
    return chemin


def generer_pdf_bulletin(nom_eleve: str, prenom_eleve: str, periode_libelle: str,
                          moyenne_generale: float, rang: int, appreciation: str = "") -> str:
    from fpdf import FPDF

    dossier = os.path.join(STORAGE_DIR, "bulletins")
    _ensure_dir(dossier)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Bulletin scolaire", ln=True, align="C")
    pdf.set_font("Helvetica", "", 12)
    pdf.ln(10)
    pdf.cell(0, 8, f"Eleve : {prenom_eleve} {nom_eleve}", ln=True)
    pdf.cell(0, 8, f"Periode : {periode_libelle}", ln=True)
    pdf.cell(0, 8, f"Moyenne generale : {moyenne_generale}/20", ln=True)
    pdf.cell(0, 8, f"Rang : {rang}", ln=True)
    if appreciation:
        pdf.ln(5)
        pdf.multi_cell(0, 8, f"Appreciation : {appreciation}")

    nom_fichier = f"bulletin_{nom_eleve}_{prenom_eleve}_{periode_libelle}.pdf".replace(" ", "_")
    chemin = os.path.join(dossier, nom_fichier)
    pdf.output(chemin)
    return chemin