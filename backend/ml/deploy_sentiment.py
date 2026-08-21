import os

from azure.ai.ml import MLClient
from azure.ai.ml.entities import (
    CodeConfiguration,
    Environment,
    ManagedOnlineDeployment,
    ManagedOnlineEndpoint,
)
from azure.identity import DefaultAzureCredential


SUBSCRIPTION_ID = os.environ["AZURE_SUBSCRIPTION_ID"]
RESOURCE_GROUP = os.environ.get(
    "AZURE_RESOURCE_GROUP",
    "rg-ai-development",
)
WORKSPACE_NAME = os.environ.get(
    "AZURE_ML_WORKSPACE",
    "aml-development",
)

ENDPOINT_NAME = "sentiment-ai-4bb8b779"
DEPLOYMENT_NAME = "sentiment-v1"


def main():

    print("======================================")
    print("Azure ML Sentiment Model Deployment")
    print("======================================")

    print(f"Resource Group : {RESOURCE_GROUP}")
    print(f"Workspace      : {WORKSPACE_NAME}")
    print(f"Endpoint       : {ENDPOINT_NAME}")

    credential = DefaultAzureCredential()

    ml_client = MLClient(
        credential=credential,
        subscription_id=SUBSCRIPTION_ID,
        resource_group_name=RESOURCE_GROUP,
        workspace_name=WORKSPACE_NAME,
    )

    print("Azure ML client created successfully.")

    # --------------------------------------------------
    # Create / update inference environment
    # --------------------------------------------------

    environment = Environment(
        name="sentiment-inference-env",
        description="Environment for sentiment analysis inference",
        image="mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest",
        conda_file="backend/ml/sentiment/environment.yml",
    )

    print("Creating/updating Azure ML environment...")

    ml_client.environments.create_or_update(environment)

    print("Environment ready.")

    # --------------------------------------------------
    # Create / update endpoint
    # --------------------------------------------------

    endpoint = ManagedOnlineEndpoint(
        name=ENDPOINT_NAME,
        description="Sentiment Analysis managed online endpoint",
        auth_mode="key",
    )

    print("Creating/updating managed online endpoint...")

    ml_client.online_endpoints.begin_create_or_update(
        endpoint
    ).result()

    print("Endpoint ready.")

    # --------------------------------------------------
    # Create / update deployment
    # --------------------------------------------------

    deployment = ManagedOnlineDeployment(
        name=DEPLOYMENT_NAME,
        endpoint_name=ENDPOINT_NAME,
        environment=environment,
        code_configuration=CodeConfiguration(
            code="backend/ml/sentiment",
            scoring_script="score.py",
        ),
        instance_type="Standard_DS2_v2",
        instance_count=1,
    )

    print("Creating/updating sentiment deployment...")

    ml_client.online_deployments.begin_create_or_update(
        deployment
    ).result()

    print("Sentiment deployment ready.")

    # --------------------------------------------------
    # Route all traffic to sentiment deployment
    # --------------------------------------------------

    endpoint = ml_client.online_endpoints.get(
        ENDPOINT_NAME
    )

    endpoint.traffic = {
        DEPLOYMENT_NAME: 100
    }

    ml_client.online_endpoints.begin_create_or_update(
        endpoint
    ).result()

    print("Traffic configured successfully.")

    print("======================================")
    print("Sentiment model deployment completed")
    print("======================================")


if __name__ == "__main__":
    main()