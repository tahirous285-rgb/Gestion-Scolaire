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
