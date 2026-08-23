"""
-------------------------------------------------------
Platform Configuration
Multi-Cloud Governance & Landing Zone Orchestration Platform
-------------------------------------------------------
"""

from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# -------------------------------------------------------
# Platform Information
# -------------------------------------------------------

PLATFORM_NAME = "Multi-Cloud Governance & Landing Zone Orchestration Platform"

PLATFORM_VERSION = "1.0"

# -------------------------------------------------------
# Terraform Configuration
# -------------------------------------------------------

BASE_DIRECTORY = Path(__file__).resolve().parent.parent

TERRAFORM_DIRECTORY = BASE_DIRECTORY / "terraform"

# Azure DevOps connection values are supplied as environment variables.
# Organization and project are non-secret defaults; never place a PAT in source control.
def _azure_devops_setting(name, default, placeholder):
    value = os.getenv(name, "").strip()
    return default if not value or value == placeholder else value


AZDO_ORGANIZATION = _azure_devops_setting(
    "AZDO_ORGANIZATION", "manikanta-devops", "your-organization"
)
AZDO_PROJECT = _azure_devops_setting(
    "AZDO_PROJECT", "LandingZone-Orchestrator", "your-project"
)
AZDO_AZURE_PIPELINE_ID = os.getenv("AZDO_AZURE_PIPELINE_ID", os.getenv("AZDO_PIPELINE_ID", ""))
AZDO_AWS_PIPELINE_ID = os.getenv("AZDO_AWS_PIPELINE_ID", "")
AZDO_PAT = os.getenv("AZDO_PAT", "")
AZDO_BRANCH = os.getenv("AZDO_BRANCH", "refs/heads/main")

# Model Playground endpoints. Credentials remain in the backend environment.
AZURE_SUBSCRIPTION_ID = os.getenv("AZURE_SUBSCRIPTION_ID", "")
AZURE_ML_ENDPOINT_NAME = os.getenv("AZURE_ML_ENDPOINT_NAME", "sentiment-ai-4bb8b779")
AZURE_ML_DEPLOYMENT_NAME = os.getenv("AZURE_ML_DEPLOYMENT_NAME", "sentiment-v1")
AZURE_ML_MODEL_VERSION = os.getenv("AZURE_ML_MODEL_VERSION", "1")
AZURE_ML_SCORING_URI = os.getenv("AZURE_ML_SCORING_URI", "")
AZURE_ML_ENDPOINT_KEY = os.getenv("AZURE_ML_ENDPOINT_KEY", "")
AZURE_ML_REQUEST_TIMEOUT = int(os.getenv("AZURE_ML_REQUEST_TIMEOUT", "60"))
AZURE_ML_CREDENTIAL_CACHE_SECONDS = int(os.getenv("AZURE_ML_CREDENTIAL_CACHE_SECONDS", "300"))

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_PROFILE = os.getenv("AWS_PROFILE", "")
AWS_SAGEMAKER_ENDPOINT_NAME = os.getenv(
    "AWS_SAGEMAKER_ENDPOINT_NAME",
    "sentiment-customer-ai-platform-development",
)
AWS_SAGEMAKER_MODEL_VERSION = os.getenv("AWS_SAGEMAKER_MODEL_VERSION", "distilbert-sst2")
AWS_SAGEMAKER_REQUEST_TIMEOUT = int(os.getenv("AWS_SAGEMAKER_REQUEST_TIMEOUT", "70"))

# -------------------------------------------------------
# Governance Configuration
# -------------------------------------------------------

ALLOWED_CLOUDS = [
    "Azure",
    "AWS"
]

ALLOWED_ENVIRONMENTS = [
    "Development",
    "Testing",
    "Production"
]

ALLOWED_REGIONS = {

    "Azure": [
        "Central India",
        "East US",
        "West Europe"
    ],

    "AWS": [
        "South India",
        "US East (N. Virginia)",
        "Europe (Ireland)"
    ]

}

ALLOWED_WORKLOADS = [
    "General",
    "AI"
]
