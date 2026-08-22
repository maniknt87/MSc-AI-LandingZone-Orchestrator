from datetime import datetime, timezone
from threading import RLock

import requests

from config.settings import (
    AZDO_BRANCH,
    AZDO_ORGANIZATION,
    AZDO_PAT,
    AZDO_AZURE_PIPELINE_ID,
    AZDO_AWS_PIPELINE_ID,
    AZDO_PROJECT,
)

_config_lock = RLock()
_runtime_config = {}


def normalize_run_status(state, result=None):
    state_value = str(state or "").lower()
    result_value = str(result or "").lower()
    if state_value == "completed":
        if result_value in {"succeeded", "partiallysucceeded"}:
            return "Completed"
        if result_value == "canceled":
            return "Cancelled"
        return "Failed"
    if state_value in {"inprogress", "running"}:
        return "Running"
    if state_value == "canceling":
        return "Cancelling"
    return "Queued"


def get_connection_config():
    with _config_lock:
        config = {
            "organization": _runtime_config.get("organization", AZDO_ORGANIZATION),
            "project": _runtime_config.get("project", AZDO_PROJECT),
            "azure_pipeline_id": _runtime_config.get("azure_pipeline_id", AZDO_AZURE_PIPELINE_ID),
            "aws_pipeline_id": _runtime_config.get("aws_pipeline_id", AZDO_AWS_PIPELINE_ID),
            "branch": _runtime_config.get("branch", AZDO_BRANCH),
            "pat": _runtime_config.get("pat", AZDO_PAT),
        }
    return config


def get_connection_status():
    config = get_connection_config()
    return {
        "configured": all(config.get(key) for key in ("organization", "project", "azure_pipeline_id", "aws_pipeline_id", "pat")),
        "organization": config["organization"],
        "project": config["project"],
        "azure_pipeline_id": str(config["azure_pipeline_id"] or ""),
        "aws_pipeline_id": str(config["aws_pipeline_id"] or ""),
        "branch": config["branch"],
        "pat_configured": bool(config["pat"]),
        "source": "onboarding" if _runtime_config else "environment",
    }


def configure_connection(organization, project, azure_pipeline_id, aws_pipeline_id, branch, pat):
    pipelines = {}
    for cloud, pipeline_id in (("Azure", azure_pipeline_id), ("AWS", aws_pipeline_id)):
        url = f"https://dev.azure.com/{organization}/{project}/_apis/pipelines/{pipeline_id}?api-version=7.1"
        response = requests.get(url, auth=("", pat), timeout=20)
        response.raise_for_status()
        pipelines[cloud] = response.json()
    with _config_lock:
        _runtime_config.update({
            "organization": organization,
            "project": project,
            "azure_pipeline_id": str(azure_pipeline_id),
            "aws_pipeline_id": str(aws_pipeline_id),
            "branch": branch,
            "pat": pat,
        })
    return {
        **get_connection_status(),
        "pipeline_names": {
            "Azure": pipelines["Azure"].get("name", str(azure_pipeline_id)),
            "AWS": pipelines["AWS"].get("name", str(aws_pipeline_id)),
        },
    }


def queue_pipeline(deployment):
    config = get_connection_config()
    cloud = str(deployment.cloud).strip()
    pipeline_key = {"Azure": "azure_pipeline_id", "AWS": "aws_pipeline_id"}.get(cloud)
    if not pipeline_key:
        raise RuntimeError(f"No deployment pipeline is registered for cloud '{cloud}'.")
    pipeline_id = config[pipeline_key]
    missing = [name for name, value in {
        "organization": config["organization"],
        "project": config["project"],
        f"{cloud.lower()}_pipeline_id": pipeline_id,
        "PAT": config["pat"],
    }.items() if not value]
    if missing:
        raise RuntimeError(
            "Azure DevOps is not configured. Missing: " + ", ".join(missing)
        )

    url = (
        f"https://dev.azure.com/{config['organization']}/{config['project']}"
        f"/_apis/pipelines/{pipeline_id}/runs?api-version=7.1"
    )
    parameters = {
        "action": "apply",
        "cloud": cloud,
        "deploymentName": deployment.deploymentName,
        "environment": deployment.environment,
        "region": deployment.region,
        "workload": deployment.workload,
        "modelId": deployment.modelId,
        "modelName": deployment.modelName,
        "vmSize": deployment.vmSize,
        "hubAddressSpace": deployment.hubAddressSpace,
        "generalSpokeAddressSpace": deployment.generalSpokeAddressSpace,
        "aiSpokeAddressSpace": deployment.aiSpokeAddressSpace,
        "enableMonitoring": deployment.enableMonitoring,
        "enablePrivateEndpoint": deployment.enablePrivateEndpoint,
    }
    response = requests.post(
        url,
        auth=("", config["pat"]),
        headers={"Content-Type": "application/json"},
        json={
            "resources": {
                "repositories": {
                    "self": {"refName": config["branch"]}
                }
            },
            "templateParameters": parameters,
        },
        timeout=30,
    )
    response.raise_for_status()
    run = response.json()

    return {
        "provider": "Azure DevOps",
        "pipeline_name": run.get("pipeline", {}).get("name", str(pipeline_id)),
        "target_cloud": cloud,
        "pipeline_id": str(run["id"]),
        "pipeline_definition_id": str(pipeline_id),
        "pipeline_url": run.get("_links", {}).get("web", {}).get("href", ""),
        "queued_time": datetime.now(timezone.utc).isoformat(),
        "status": normalize_run_status(run.get("state", "notStarted"), run.get("result")),
        "result": run.get("result"),
    }


def get_pipeline_run(cloud, run_id, pipeline_definition_id=None):
    config = get_connection_config()
    pipeline_key = {"Azure": "azure_pipeline_id", "AWS": "aws_pipeline_id"}.get(cloud)
    definition_id = pipeline_definition_id or (config.get(pipeline_key) if pipeline_key else None)
    missing = [name for name, value in {
        "organization": config.get("organization"),
        "project": config.get("project"),
        "pipeline_definition_id": definition_id,
        "PAT": config.get("pat"),
    }.items() if not value]
    if missing:
        raise RuntimeError("Azure DevOps status synchronization is missing: " + ", ".join(missing))

    url = (
        f"https://dev.azure.com/{config['organization']}/{config['project']}"
        f"/_apis/pipelines/{definition_id}/runs/{run_id}?api-version=7.1"
    )
    response = requests.get(url, auth=("", config["pat"]), timeout=15)
    response.raise_for_status()
    run = response.json()
    return {
        "status": normalize_run_status(run.get("state"), run.get("result")),
        "result": run.get("result"),
        "pipeline_url": run.get("_links", {}).get("web", {}).get("href", ""),
        "finished_time": run.get("finishedDate") if run.get("state") == "completed" else None,
    }
