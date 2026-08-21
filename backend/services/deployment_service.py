from fastapi import HTTPException
import requests

from services.azure_devops import queue_pipeline
from services.deployment_history import save_deployment
from services.policy_service import validate_policy
from services.policy_service import AI_WORKLOADS


# =====================================================
# Process Deployment
# =====================================================

def process_deployment(deployment):

    cloud = deployment.cloud
    workload = deployment.workload
    environment = deployment.environment
    region = deployment.region

    # =================================================
    # GOVERNANCE GATE
    # =================================================

    policy_result = validate_policy(
        deployment
    )

    # ---------------------------------------------
    # Governance failure = HARD STOP
    # ---------------------------------------------

    if not policy_result["allowed"]:

        raise HTTPException(
            status_code=400,
            detail=policy_result
        )

    # =================================================
    # Deployment Plan
    # =================================================

    deployment_plan = {}

    # =================================================
    # Azure
    # =================================================

    if cloud == "Azure":

        # -----------------------------------------
        # General Workload
        # -----------------------------------------

        if workload == "General":

            deployment_plan = {

                "cloud": cloud,

                "pipeline":
                    "azure-general-pipeline",

                "terraform":
                    "azure-general.tfvars",

                "environment":
                    environment,

                "region":
                    region,

                "status":
                    "Ready for Azure Deployment"

            }

        # -----------------------------------------
        # AI Workload
        # -----------------------------------------

        elif workload in AI_WORKLOADS:

            deployment_plan = {

                "cloud": cloud,

                "pipeline":
                    "azure-ai-pipeline",

                "terraform":
                    "azure-ai.tfvars",

                "environment":
                    environment,

                "region":
                    region,

                "status":
                    "Ready for Azure AI Deployment"

            }

    # =================================================
    # AWS
    # =================================================

    elif cloud == "AWS":

        # -----------------------------------------
        # General Workload
        # -----------------------------------------

        if workload == "General":

            deployment_plan = {

                "cloud": cloud,

                "pipeline":
                    "aws-general-pipeline",

                "terraform":
                    "aws-general.tfvars",

                "environment":
                    environment,

                "region":
                    region,

                "status":
                    "Ready for AWS Deployment"

            }

        # -----------------------------------------
        # AI Workload
        # -----------------------------------------

        elif workload in AI_WORKLOADS:

            deployment_plan = {

                "cloud": cloud,

                "pipeline":
                    "aws-ai-pipeline",

                "terraform":
                    "aws-ai.tfvars",

                "environment":
                    environment,

                "region":
                    region,

                "status":
                    "Ready for AWS AI Deployment"

            }

    # =================================================
    # Unsupported Deployment
    # =================================================

    if not deployment_plan:

        raise HTTPException(

            status_code=400,

            detail={
                "status": "Unsupported Deployment",
                "message":
                    "The selected cloud and workload "
                    "combination is not supported."
            }

        )

    try:
        pipeline = queue_pipeline(deployment)
    except requests.RequestException as error:
        detail = error.response.text if error.response is not None else str(error)
        raise HTTPException(status_code=502, detail=f"Azure DevOps queue failed: {detail}") from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    deployment_record = save_deployment(deployment, pipeline)

    # =================================================
    # RETURN IMMEDIATELY
    # =================================================

    return {

        "status": "QUEUED",

        "message":
            "Deployment pipeline queued successfully.",

        "plan":
            deployment_plan,

        "policy":
            policy_result,

        "pipeline": pipeline,

        "deployment_id": deployment_record["deployment_id"],

        "deployment":
            {

                "cloud":
                    cloud,

                "workload":
                    workload,

                "environment":
                    environment,

                "region":
                    region

            }

    }
