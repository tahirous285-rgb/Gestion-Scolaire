from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.core.schema_updates import ensure_evaluation_notes_validation_column, ensure_presence_subject_column, ensure_teacher_contract_column
from app.api.v1.api import api_router
from app.models import caisse as caisse_models

Base.metadata.create_all(bind=engine)
ensure_teacher_contract_column(engine)
ensure_evaluation_notes_validation_column(engine)
ensure_presence_subject_column(engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"success": True, "message": "API ProjetEcole opérationnelle"}