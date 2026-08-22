import argparse
import json
import re
import time

import boto3
from botocore.exceptions import ClientError
from sagemaker import Session, image_uris


MODEL_HUB_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"


def resource_name(prefix, deployment_name, environment):
    value = re.sub(r"[^a-z0-9-]", "-", f"{prefix}-{deployment_name}-{environment}".lower())
    return re.sub(r"-+", "-", value).strip("-")[:63]


def exists(client, operation, parameter, name):
    try:
        getattr(client, operation)(**{parameter: name})
        return True
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ValidationException":
            return False
        raise


def wait_for_endpoint_absent(client, endpoint_name):
    while exists(client, "describe_endpoint", "EndpointName", endpoint_name):
        print(f"Waiting for endpoint {endpoint_name} to be deleted...")
        time.sleep(20)


def delete_resources(client, endpoint_name, endpoint_config_name, model_name):
    if exists(client, "describe_endpoint", "EndpointName", endpoint_name):
        client.delete_endpoint(EndpointName=endpoint_name)
        wait_for_endpoint_absent(client, endpoint_name)
    if exists(client, "describe_endpoint_config", "EndpointConfigName", endpoint_config_name):
        client.delete_endpoint_config(EndpointConfigName=endpoint_config_name)
    if exists(client, "describe_model", "ModelName", model_name):
        client.delete_model(ModelName=model_name)


def deploy(args):
    boto_session = boto3.Session(region_name=args.region)
    client = boto_session.client("sagemaker")
    sm_session = Session(boto_session=boto_session)
    endpoint_name = resource_name("sentiment", args.deployment_name, args.environment)
    endpoint_config_name = resource_name("sentiment-config", args.deployment_name, args.environment)
    model_name = resource_name("sentiment-model", args.deployment_name, args.environment)

    # Replacing all three named resources makes reruns deterministic and ensures
    # a changed model/container is never hidden behind an old endpoint config.
    delete_resources(client, endpoint_name, endpoint_config_name, model_name)

    image_uri = image_uris.retrieve(
        framework="huggingface",
        region=args.region,
        version="4.37.0",
        py_version="py310",
        image_scope="inference",
        base_framework_version="pytorch2.1.0",
        instance_type=args.instance_type,
    )
    client.create_model(
        ModelName=model_name,
        ExecutionRoleArn=args.execution_role_arn,
        PrimaryContainer={
            "Image": image_uri,
            "ModelDataUrl": args.model_data_url,
            "Environment": {
                "SAGEMAKER_PROGRAM": "inference.py",
                "SAGEMAKER_SUBMIT_DIRECTORY": "/opt/ml/model/code",
            },
        },
    )
    client.create_endpoint_config(
        EndpointConfigName=endpoint_config_name,
        ProductionVariants=[{
            "VariantName": "AllTraffic",
            "ModelName": model_name,
            "InitialInstanceCount": 1,
            "InstanceType": args.instance_type,
            "InitialVariantWeight": 1.0,
        }],
    )
    client.create_endpoint(
        EndpointName=endpoint_name,
        EndpointConfigName=endpoint_config_name,
        Tags=[
            {"Key": "ManagedBy", "Value": "AzureDevOps"},
            {"Key": "Environment", "Value": args.environment},
            {"Key": "Workload", "Value": "sentiment-analysis"},
        ],
    )
    print(f"Waiting for SageMaker endpoint {endpoint_name}...")
    client.get_waiter("endpoint_in_service").wait(
        EndpointName=endpoint_name,
        WaiterConfig={"Delay": 30, "MaxAttempts": 60},
    )
    description = client.describe_endpoint(EndpointName=endpoint_name)
    print(json.dumps({
        "endpoint_name": endpoint_name,
        "endpoint_status": description["EndpointStatus"],
        "model_id": MODEL_HUB_ID,
        "model_data_url": args.model_data_url,
        "instance_type": args.instance_type,
        "region": args.region,
    }, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--region", required=True)
    parser.add_argument("--deployment-name", required=True)
    parser.add_argument("--environment", required=True)
    parser.add_argument("--instance-type", required=True)
    parser.add_argument("--execution-role-arn", required=True)
    parser.add_argument("--model-data-url", required=True)
    deploy(parser.parse_args())


if __name__ == "__main__":
    main()
