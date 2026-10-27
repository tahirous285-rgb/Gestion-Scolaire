from sqlalchemy import inspect


def ensure_teacher_contract_column(engine):
    inspector = inspect(engine)
    if not inspector.has_table("enseignant"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("enseignant")}
    if "type_contrat" in existing_columns:
        return

    with engine.begin() as connection:
        connection.exec_driver_sql(
            "ALTER TABLE enseignant ADD COLUMN type_contrat VARCHAR"
        )


def ensure_evaluation_notes_validation_column(engine):
    inspector = inspect(engine)
    if not inspector.has_table("evaluation"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("evaluation")}
    if "notes_validees" in existing_columns:
        return

    with engine.begin() as connection:
        connection.exec_driver_sql(
            "ALTER TABLE evaluation ADD COLUMN notes_validees BOOLEAN NOT NULL DEFAULT 0"
        )


def ensure_presence_subject_column(engine):
    inspector = inspect(engine)
    if not inspector.has_table("presence_eleve"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("presence_eleve")}
    if "id_matiere" in existing_columns:
        return

    with engine.begin() as connection:
        connection.exec_driver_sql(
            "ALTER TABLE presence_eleve ADD COLUMN id_matiere INTEGER"
        )
