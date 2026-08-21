from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from models.deployment import DeploymentRequest
from services.deployment_service import process_deployment
from services.auth_service import verify_access_token

from services.deployment_history import (
    get_deployment_history,
    update_deployment_status,
    get_deployment,
)


router = APIRouter()

# ---------------------------------------
# Authentication
# ---------------------------------------

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
):
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    user = verify_access_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )

    return user


# ---------------------------------------
# Status Update Request Model
# ---------------------------------------

class StatusUpdateRequest(BaseModel):
    status: str


# ---------------------------------------
# Deploy Landing Zone
# ---------------------------------------

@router.post("/deploy")
def deploy(
    request: DeploymentRequest,
    current_user: dict = Depends(get_current_user)
):

    # ---------------------------------------
    # Platform RBAC
    # ---------------------------------------

    if current_user["role"] not in [
        "Administrator",
        "Contributor"
    ]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to deploy a landing zone."
        )

    # ---------------------------------------
    # Process Deployment
    # ---------------------------------------

    deployment = process_deployment(request)

    return {
        "status": "success",
        "message": "Deployment pipeline queued successfully.",
        "deployment": request.model_dump(),
        "result": deployment
    }


# ---------------------------------------
# Get Deployment History
# ---------------------------------------

@router.get("/deployments")
def get_deployments():

    return {
        "count": len(get_deployment_history()),
        "deployments": get_deployment_history()
    }


# ---------------------------------------
# Get Single Deployment
# ---------------------------------------

@router.get("/deployments/{deployment_id}")
def get_single_deployment(
    deployment_id: str
):

    deployment = get_deployment(deployment_id)

    if deployment is None:
        return {
            "status": "error",
            "message": "Deployment not found."
        }

    return deployment


# ---------------------------------------
# Update Deployment Status
# ---------------------------------------

@router.put("/deployments/{deployment_id}/status")
def update_status(
    deployment_id: str,
    request: StatusUpdateRequest
):

    deployment = update_deployment_status(
        deployment_id,
        request.status
    )

    if deployment is None:
        return {
            "status": "error",
            "message": "Deployment not found."
        }

    return {
        "status": "success",
        "message": "Deployment status updated successfully.",
        "deployment": deployment
    }