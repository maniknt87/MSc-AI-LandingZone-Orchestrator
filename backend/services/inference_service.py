import json
import re
import time
import uuid

import boto3
import requests
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from config.settings import (
    AWS_PROFILE,
    AWS_REGION,
    AWS_SAGEMAKER_ENDPOINT_NAME,
    AWS_SAGEMAKER_MODEL_VERSION,
    AWS_SAGEMAKER_REQUEST_TIMEOUT,
    AZURE_ML_DEPLOYMENT_NAME,
    AZURE_ML_CREDENTIAL_CACHE_SECONDS,
    AZURE_ML_ENDPOINT_KEY,
    AZURE_ML_ENDPOINT_NAME,
    AZURE_ML_MODEL_VERSION,
    AZURE_ML_REQUEST_TIMEOUT,
    AZURE_ML_SCORING_URI,
    AZURE_SUBSCRIPTION_ID,
)
from database.database import get_connection


_azure_runtime_cache = {}


def _aws_session():
    return boto3.Session(profile_name=AWS_PROFILE or None, region_name=AWS_REGION)


def _aws_is_configured():
    if not AWS_SAGEMAKER_ENDPOINT_NAME:
        return False


def _azure_slug(value):
    return re.sub(r"[^a-z0-9-]+", "-", str(value).strip().lower()).strip("-")


def _dynamic_azure_deployments():
    """Build playground targets from successful application deployment history."""
    if not AZURE_SUBSCRIPTION_ID:
        return []
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT id, environment, request_payload
            FROM deployments
            WHERE cloud = 'Azure'
              AND action = 'apply'
              AND status = 'Completed'
              AND request_payload IS NOT NULL
            ORDER BY id DESC
            """
        ).fetchall()
    finally:
        connection.close()

    deployments = []
    seen = set()
    for row in rows:
        try:
            payload = json.loads(row["request_payload"])
        except (TypeError, json.JSONDecodeError):
            continue
        workload = payload.get("workload", "")
        if str(workload).lower() not in {"sentiment-analysis", "sentiment analysis"}:
            continue
        deployment_name = payload.get("deploymentName") or payload.get("deployment_name")
        environment = payload.get("environment") or row["environment"]
        if not deployment_name or not environment:
            continue
        identity = (_azure_slug(deployment_name), _azure_slug(environment))
        if identity in seen:
            continue
        seen.add(identity)
        deployments.append({
            "id": f"azure:history:{row['id']}",
            "endpoint_name": AZURE_ML_ENDPOINT_NAME,
            "deployment_name": AZURE_ML_DEPLOYMENT_NAME,
            "model_name": "Validated Sentiment Analysis Model",
            "model_version": AZURE_ML_MODEL_VERSION,
            "workload": "sentiment-analysis",
            "cloud": "Azure",
            "environment": environment,
            "status": "Ready",
            "configured": True,
            "private": True,
            "subscription_id": AZURE_SUBSCRIPTION_ID,
            "resource_group": f"rg-{_azure_slug(deployment_name)}-ai-{_azure_slug(environment)}",
            "workspace_name": f"aml-{_azure_slug(environment)}",
            "dynamic_credentials": True,
        })
    return deployments
    try:
        return _aws_session().get_credentials() is not None
    except (BotoCoreError, ClientError):
        return False


def list_playground_deployments():
    dynamic_azure = _dynamic_azure_deployments()
    azure_configured = bool(AZURE_ML_SCORING_URI and AZURE_ML_ENDPOINT_KEY)
    aws_configured = _aws_is_configured()
    static_azure = [] if dynamic_azure else [{
            "id": f"azure:{AZURE_ML_ENDPOINT_NAME}",
            "endpoint_name": AZURE_ML_ENDPOINT_NAME,
            "deployment_name": AZURE_ML_DEPLOYMENT_NAME,
            "model_name": "Validated Sentiment Analysis Model",
            "model_version": AZURE_ML_MODEL_VERSION,
            "workload": "sentiment-analysis",
            "cloud": "Azure",
            "environment": "Development",
            "status": "Ready" if azure_configured else "Configuration required",
            "configured": azure_configured,
            "private": True,
        }]
    return dynamic_azure + static_azure + [{
            "id": f"aws:{AWS_SAGEMAKER_ENDPOINT_NAME}",
            "endpoint_name": AWS_SAGEMAKER_ENDPOINT_NAME,
            "deployment_name": "AllTraffic",
            "model_name": "AWS SageMaker Sentiment Model",
            "model_version": AWS_SAGEMAKER_MODEL_VERSION,
            "workload": "sentiment-analysis",
            "cloud": "AWS",
            "environment": "Development",
            "status": "Ready" if aws_configured else "AWS credentials required",
            "configured": aws_configured,
            "private": False,
        }]


def _get_azure_runtime(deployment):
    if not deployment.get("dynamic_credentials"):
        if not AZURE_ML_SCORING_URI or not AZURE_ML_ENDPOINT_KEY:
            raise RuntimeError("The Azure ML scoring URI and endpoint key are not configured.")
        return AZURE_ML_SCORING_URI, AZURE_ML_ENDPOINT_KEY

    cache_key = (
        deployment["subscription_id"], deployment["resource_group"],
        deployment["workspace_name"], deployment["endpoint_name"],
    )
    cached = _azure_runtime_cache.get(cache_key)
    if cached and cached["expires_at"] > time.monotonic():
        return cached["scoring_uri"], cached["endpoint_key"]

    # Lazy imports keep the application bootable while dependencies are being installed.
    from azure.ai.ml import MLClient
    from azure.identity import DefaultAzureCredential

    client = MLClient(
        DefaultAzureCredential(),
        deployment["subscription_id"],
        deployment["resource_group"],
        deployment["workspace_name"],
    )
    endpoint = client.online_endpoints.get(deployment["endpoint_name"])
    keys = client.online_endpoints.get_keys(deployment["endpoint_name"])
    scoring_uri = endpoint.scoring_uri
    endpoint_key = keys.primary_key
    if not scoring_uri or not endpoint_key:
        raise RuntimeError("Azure ML did not return a scoring URI and primary endpoint key.")
    _azure_runtime_cache[cache_key] = {
        "scoring_uri": scoring_uri,
        "endpoint_key": endpoint_key,
        "expires_at": time.monotonic() + AZURE_ML_CREDENTIAL_CACHE_SECONDS,
    }
    return scoring_uri, endpoint_key


def _record_run(record):
    connection = get_connection()
    try:
        connection.execute(
            """
            INSERT INTO inference_runs (
                request_id, username, cloud, endpoint_name, deployment_name,
                workload, input_preview, prediction, confidence,
                latency_ms, status, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["request_id"], record["username"], record["cloud"],
                record["endpoint_name"], record["deployment_name"],
                record["workload"], record["input_preview"],
                record.get("prediction"), record.get("confidence"),
                record["latency_ms"], record["status"],
                record.get("error_message"),
            ),
        )
        connection.commit()
    finally:
        connection.close()


def get_recent_inference_runs(limit=20):
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT request_id, cloud, endpoint_name, deployment_name, workload,
                   input_preview, prediction, confidence, latency_ms,
                   status, error_message, created_at
            FROM inference_runs ORDER BY id DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def _normalized_response(base_record, model_version, prediction, confidence, latency_ms):
    _record_run({
        **base_record,
        "prediction": str(prediction),
        "confidence": float(confidence),
        "latency_ms": latency_ms,
        "status": "Succeeded",
    })
    return {
        "request_id": base_record["request_id"],
        "cloud": base_record["cloud"],
        "workload": base_record["workload"],
        "endpoint_name": base_record["endpoint_name"],
        "deployment_name": base_record["deployment_name"],
        "model_version": model_version,
        "prediction": {"label": str(prediction), "confidence": float(confidence)},
        "metrics": {"latency_ms": latency_ms},
    }


def _base_record(deployment, text, username):
    return {
        "request_id": str(uuid.uuid4()),
        "username": username,
        "cloud": deployment["cloud"],
        "endpoint_name": deployment["endpoint_name"],
        "deployment_name": deployment["deployment_name"],
        "workload": deployment["workload"],
        "input_preview": text[:160],
    }


def _record_failure(base_record, started, error):
    _record_run({
        **base_record,
        "latency_ms": round((time.perf_counter() - started) * 1000),
        "status": "Failed",
        "error_message": str(error)[:500],
    })


def _invoke_azure(deployment, text, username):
    started = time.perf_counter()
    base_record = _base_record(deployment, text, username)
    try:
        scoring_uri, endpoint_key = _get_azure_runtime(deployment)
        response = requests.post(
            scoring_uri,
            headers={"Authorization": f"Bearer {endpoint_key}", "Content-Type": "application/json"},
            json={"text": text},
            timeout=AZURE_ML_REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        result = response.json()
        if isinstance(result, str):
            result = json.loads(result)
        prediction, confidence = result.get("label"), result.get("score")
        if prediction is None or confidence is None:
            raise ValueError("The Azure model response is missing label or score.")
        latency_ms = round((time.perf_counter() - started) * 1000)
        return _normalized_response(base_record, deployment["model_version"], prediction, confidence, latency_ms)
    except Exception as error:
        _record_failure(base_record, started, error)
        raise RuntimeError("Azure ML inference failed. Check endpoint health and backend credentials.") from error


def _extract_aws_prediction(result):
    candidate = result
    # Accept both the canonical Hugging Face response and the legacy v2
    # package response, which wrapped a JSON string and content type in a list.
    for _ in range(4):
        if isinstance(candidate, list) and candidate:
            candidate = candidate[0]
            continue
        if isinstance(candidate, str):
            candidate = json.loads(candidate)
            continue
        break
    if not isinstance(candidate, dict):
        raise ValueError("The SageMaker model returned an unsupported response format.")
    prediction, confidence = candidate.get("label"), candidate.get("score")
    if prediction is None or confidence is None:
        raise ValueError("The SageMaker response is missing label or score.")
    return prediction, confidence


def _invoke_aws(deployment, text, username):
    started = time.perf_counter()
    base_record = _base_record(deployment, text, username)
    try:
        client = _aws_session().client(
            "sagemaker-runtime",
            config=Config(connect_timeout=10, read_timeout=AWS_SAGEMAKER_REQUEST_TIMEOUT, retries={"max_attempts": 2}),
        )
        response = client.invoke_endpoint(
            EndpointName=deployment["endpoint_name"],
            ContentType="application/json",
            Body=json.dumps({"inputs": text}).encode("utf-8"),
        )
        result = json.loads(response["Body"].read().decode("utf-8"))
        prediction, confidence = _extract_aws_prediction(result)
        latency_ms = round((time.perf_counter() - started) * 1000)
        return _normalized_response(base_record, deployment["model_version"], prediction, confidence, latency_ms)
    except (BotoCoreError, ClientError, ValueError, json.JSONDecodeError) as error:
        _record_failure(base_record, started, error)
        raise RuntimeError("AWS SageMaker inference failed. Check endpoint health, region, and backend IAM credentials.") from error


def invoke_sentiment_endpoint(deployment, text, username):
    if deployment["cloud"] == "Azure":
        return _invoke_azure(deployment, text, username)
    if deployment["cloud"] == "AWS":
        return _invoke_aws(deployment, text, username)
    raise RuntimeError(f"Unsupported inference cloud: {deployment['cloud']}")
