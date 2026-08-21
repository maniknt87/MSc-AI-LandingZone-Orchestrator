import json
import time
import uuid

import requests

from config.settings import (
    AZURE_ML_DEPLOYMENT_NAME,
    AZURE_ML_ENDPOINT_KEY,
    AZURE_ML_ENDPOINT_NAME,
    AZURE_ML_MODEL_VERSION,
    AZURE_ML_REQUEST_TIMEOUT,
    AZURE_ML_SCORING_URI,
)
from database.database import get_connection


def list_playground_deployments():
    configured = bool(AZURE_ML_SCORING_URI and AZURE_ML_ENDPOINT_KEY)
    return [
        {
            "id": AZURE_ML_ENDPOINT_NAME,
            "endpoint_name": AZURE_ML_ENDPOINT_NAME,
            "deployment_name": AZURE_ML_DEPLOYMENT_NAME,
            "model_name": "Validated Sentiment Analysis Model",
            "model_version": AZURE_ML_MODEL_VERSION,
            "workload": "sentiment-analysis",
            "cloud": "Azure",
            "environment": "Development",
            "status": "Ready" if configured else "Configuration required",
            "configured": configured,
            "private": True,
        }
    ]


def _record_run(record):
    connection = get_connection()
    try:
        connection.execute(
            """
            INSERT INTO inference_runs (
                request_id, username, endpoint_name, deployment_name,
                workload, input_preview, prediction, confidence,
                latency_ms, status, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["request_id"],
                record["username"],
                record["endpoint_name"],
                record["deployment_name"],
                record["workload"],
                record["input_preview"],
                record.get("prediction"),
                record.get("confidence"),
                record["latency_ms"],
                record["status"],
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
            SELECT request_id, endpoint_name, deployment_name, workload,
                   input_preview, prediction, confidence, latency_ms,
                   status, error_message, created_at
            FROM inference_runs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def invoke_sentiment_endpoint(text, username):
    if not AZURE_ML_SCORING_URI or not AZURE_ML_ENDPOINT_KEY:
        raise RuntimeError(
            "The Azure ML scoring URI and endpoint key are not configured on the backend."
        )

    request_id = str(uuid.uuid4())
    started = time.perf_counter()
    base_record = {
        "request_id": request_id,
        "username": username,
        "endpoint_name": AZURE_ML_ENDPOINT_NAME,
        "deployment_name": AZURE_ML_DEPLOYMENT_NAME,
        "workload": "sentiment-analysis",
        "input_preview": text[:160],
    }

    try:
        response = requests.post(
            AZURE_ML_SCORING_URI,
            headers={
                "Authorization": f"Bearer {AZURE_ML_ENDPOINT_KEY}",
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
            },
            json={"text": text},
            timeout=AZURE_ML_REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        result = response.json()
        if isinstance(result, str):
            result = json.loads(result)
        if not isinstance(result, dict):
            raise ValueError("The model returned an unsupported response format.")
        if result.get("error"):
            raise ValueError(result["error"])

        prediction = result.get("label")
        confidence = result.get("score")
        if prediction is None or confidence is None:
            raise ValueError("The model response is missing label or score.")

        latency_ms = round((time.perf_counter() - started) * 1000)
        normalized = {
            "request_id": request_id,
            "workload": "sentiment-analysis",
            "endpoint_name": AZURE_ML_ENDPOINT_NAME,
            "deployment_name": AZURE_ML_DEPLOYMENT_NAME,
            "model_version": AZURE_ML_MODEL_VERSION,
            "prediction": {
                "label": str(prediction),
                "confidence": float(confidence),
            },
            "metrics": {"latency_ms": latency_ms},
        }
        _record_run(
            {
                **base_record,
                "prediction": str(prediction),
                "confidence": float(confidence),
                "latency_ms": latency_ms,
                "status": "Succeeded",
            }
        )
        return normalized
    except (requests.RequestException, ValueError) as error:
        latency_ms = round((time.perf_counter() - started) * 1000)
        _record_run(
            {
                **base_record,
                "latency_ms": latency_ms,
                "status": "Failed",
                "error_message": str(error)[:500],
            }
        )
        raise RuntimeError(
            "Azure ML inference failed. Confirm endpoint health, private network reachability, DNS, and backend credentials."
        ) from error
