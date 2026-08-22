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
    get_destroy_source,
    save_deployment,
    get_retry_source,
)
from services.azure_devops import queue_pipeline


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
    deployments = get_deployment_history(sync=True)
    return {
        "count": len(deployments),
        "deployments": deployments
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


@router.post("/deployments/{deployment_id}/destroy")
def destroy_deployment(
    deployment_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ["Administrator", "Contributor"]:
        raise HTTPException(status_code=403, detail="You are not authorized to destroy a landing zone.")

    source, active_destroy = get_destroy_source(deployment_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Deployment not found.")
    if source.get("action", "apply") != "apply" or source["status"] != "Completed":
        raise HTTPException(status_code=409, detail="Only a completed apply deployment can be destroyed.")
    if not source.get("request"):
        raise HTTPException(
            status_code=409,
            detail="This historical deployment does not contain the original parameters. Destroy it from Azure DevOps.",
        )
    if active_destroy:
        raise HTTPException(status_code=409, detail="A destroy run is already active for this deployment.")

    request = DeploymentRequest.model_validate(source["request"])
    try:
        pipeline = queue_pipeline(request, action="destroy")
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Azure DevOps destroy queue failed: {error}") from error
    parent_id = int(deployment_id.split("-", 1)[1])
    record = save_deployment(request, pipeline, action="destroy", parent_deployment_id=parent_id)
    return {
        "status": "success",
        "message": "Destroy pipeline queued successfully.",
        "deployment": record,
    }


@router.post("/deployments/{deployment_id}/retry")
def retry_deployment(
    deployment_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ["Administrator", "Contributor"]:
        raise HTTPException(status_code=403, detail="You are not authorized to retry a deployment.")

    source, active_retry = get_retry_source(deployment_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Deployment not found.")
    if source.get("action", "apply") != "apply" or source["status"] != "Failed":
        raise HTTPException(status_code=409, detail="Only a failed apply deployment can be retried.")
    if not source.get("request"):
        raise HTTPException(
            status_code=409,
            detail="This historical deployment does not contain the original parameters. Retry it from Azure DevOps.",
        )
    if active_retry:
        raise HTTPException(status_code=409, detail="A retry is already active for this deployment.")

    request = DeploymentRequest.model_validate(source["request"])
    try:
        pipeline = queue_pipeline(request, action="apply")
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Azure DevOps retry queue failed: {error}") from error
    source_id = int(deployment_id.split("-", 1)[1])
    record = save_deployment(request, pipeline, action="apply", retry_of_deployment_id=source_id)
    return {
        "status": "success",
        "message": "A fresh deployment retry was queued successfully.",
        "deployment": record,
    }


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
