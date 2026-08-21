# ==========================================
# Multi-Cloud Governance & Landing Zone
# Orchestration Platform API
# ==========================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import initialize_database

from routes.deployment import router as deployment_router
from routes.governance import router as governance_router
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.onboarding import router as onboarding_router
from routes.playground import router as playground_router


# ------------------------------------------
# Initialize Database
# ------------------------------------------

initialize_database()


# ------------------------------------------
# FastAPI Application
# ------------------------------------------

app = FastAPI(
    title="Multi-Cloud Governance & Landing Zone Orchestration Platform API",
    version="1.1.0",
    description="Backend API for Multi-Cloud Governance and Landing Zone Orchestration"
)


# ------------------------------------------
# Allow React Frontend
# ------------------------------------------

origins = [
    "http://localhost:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------
# API Routes
# ------------------------------------------

app.include_router(deployment_router)

app.include_router(governance_router)

app.include_router(auth_router)

app.include_router(users_router)

app.include_router(onboarding_router)

app.include_router(playground_router)


# ------------------------------------------
# Root Endpoint
# ------------------------------------------

@app.get("/")
def home():

    return {
        "application": "Multi-Cloud Governance & Landing Zone Orchestration Platform",
        "version": "1.1.0",
        "status": "Running"
    }
