import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, SecretStr

from routes.deployment import get_current_user
from services.azure_devops import configure_connection, get_connection_status

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


class AzureDevOpsConnectionRequest(BaseModel):
    organization: str = Field(min_length=2, max_length=100, pattern=r"^[A-Za-z0-9._-]+$")
    project: str = Field(min_length=1, max_length=200)
    azure_pipeline_id: int = Field(gt=0)
    aws_pipeline_id: int = Field(gt=0)
    branch: str = Field(default="refs/heads/main", pattern=r"^refs/heads/.+")
    pat: SecretStr = Field(min_length=10)


def require_administrator(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Administrator":
        raise HTTPException(status_code=403, detail="Administrator access is required.")
    return current_user


@router.get("/azure-devops")
def connection_status(_: dict = Depends(require_administrator)):
    return get_connection_status()


@router.put("/azure-devops")
def save_connection(request: AzureDevOpsConnectionRequest, _: dict = Depends(require_administrator)):
    try:
        return configure_connection(
            request.organization.strip(),
            request.project.strip(),
            request.azure_pipeline_id,
            request.aws_pipeline_id,
            request.branch.strip(),
            request.pat.get_secret_value(),
        )
    except requests.HTTPError as error:
        status = error.response.status_code if error.response is not None else 502
        if status in (401, 403, 404):
            raise HTTPException(status_code=400, detail="Azure DevOps could not verify these details. Check the PAT permissions, organization, project and pipeline ID.") from error
        raise HTTPException(status_code=502, detail="Azure DevOps verification is temporarily unavailable.") from error
    except requests.RequestException as error:
        raise HTTPException(status_code=502, detail="Unable to connect to Azure DevOps.") from error
