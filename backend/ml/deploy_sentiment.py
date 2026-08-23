import os

from azure.ai.ml import MLClient
from azure.ai.ml.entities import (
    CodeConfiguration,
    Environment,
    ManagedOnlineDeployment,
    ManagedOnlineEndpoint,
    Model,
)
from azure.core.exceptions import HttpResponseError
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
MODEL_PATH = os.environ["AZURE_MODEL_PATH"]
INSTANCE_TYPE = os.environ.get("AZURE_ML_INSTANCE_TYPE", "Standard_DS2_v2")


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

    workspace = ml_client.workspaces.get(WORKSPACE_NAME)
    managed_network = workspace.managed_network
    managed_network_status = getattr(managed_network, "status", None)
    status_value = getattr(managed_network_status, "value", managed_network_status)
    print(f"Managed network status: {status_value or 'unknown'}")
    if str(status_value).lower() != "succeeded":
        print("Provisioning Azure ML managed network...")
        ml_client.workspaces.begin_provision_network(
            workspace_name=WORKSPACE_NAME,
            include_spark=False,
        ).result()
        workspace = ml_client.workspaces.get(WORKSPACE_NAME)
        final_status = getattr(workspace.managed_network, "status", None)
        print(f"Managed network provisioning completed: {final_status}")

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

    model = Model(
        path=MODEL_PATH,
        name="sentiment-distilbert-sst2",
        version="1",
        description="Cached DistilBERT SST-2 sentiment model",
        type="custom_model",
    )
    print("Registering cached sentiment model...")
    model = ml_client.models.create_or_update(model)
    print(f"Model ready: {model.name}:{model.version}")

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
        model=model,
        code_configuration=CodeConfiguration(
            code="backend/ml/sentiment",
            scoring_script="score.py",
        ),
        instance_type=INSTANCE_TYPE,
        instance_count=1,
    )

    print("Creating/updating sentiment deployment...")

    try:
        ml_client.online_deployments.begin_create_or_update(
            deployment
        ).result()
    except HttpResponseError as error:
        if "unrecoverable state" not in str(error).lower():
            raise
        print("Removing unrecoverable Azure ML deployment and recreating it...")
        ml_client.online_deployments.begin_delete(
            name=DEPLOYMENT_NAME,
            endpoint_name=ENDPOINT_NAME,
        ).result()
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
