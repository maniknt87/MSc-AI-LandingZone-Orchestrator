import argparse
import hashlib
import json
import shutil
import tarfile
import tempfile
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from huggingface_hub import HfApi, snapshot_download


MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
MODEL_FILES = [
    "config.json",
    "model.safetensors",
    "special_tokens_map.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.txt",
]

INFERENCE_HANDLER = r'''import json

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def model_fn(model_dir):
    tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_dir,
        local_files_only=True,
    )
    model.eval()
    return {"model": model, "tokenizer": tokenizer}


def input_fn(request_body, content_type="application/json"):
    if content_type != "application/json":
        raise ValueError(f"Unsupported content type: {content_type}")
    payload = json.loads(request_body)
    text = payload.get("inputs") or payload.get("text")
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Request must contain a non-empty 'inputs' or 'text' field")
    return text


def predict_fn(text, model_bundle):
    tokenizer = model_bundle["tokenizer"]
    model = model_bundle["model"]
    encoded = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        probabilities = torch.softmax(model(**encoded).logits, dim=-1)[0]
    index = int(torch.argmax(probabilities).item())
    label = model.config.id2label[index]
    return [{"label": label, "score": float(probabilities[index].item())}]


def output_fn(prediction, accept="application/json"):
    if accept != "application/json":
        raise ValueError(f"Unsupported accept type: {accept}")
    return prediction
'''


def ensure_bucket(s3, bucket, region):
    try:
        s3.head_bucket(Bucket=bucket)
    except ClientError as error:
        code = str(error.response.get("Error", {}).get("Code", ""))
        if code not in {"404", "NoSuchBucket", "NotFound"}:
            raise
        parameters = {"Bucket": bucket}
        if region != "us-east-1":
            parameters["CreateBucketConfiguration"] = {"LocationConstraint": region}
        s3.create_bucket(**parameters)

    s3.put_public_access_block(
        Bucket=bucket,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        },
    )
    s3.put_bucket_encryption(
        Bucket=bucket,
        ServerSideEncryptionConfiguration={
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"},
            }]
        },
    )
    s3.put_bucket_versioning(
        Bucket=bucket,
        VersioningConfiguration={"Status": "Enabled"},
    )


def object_exists(s3, bucket, key):
    try:
        response = s3.head_object(Bucket=bucket, Key=key)
        print(f"Reusing s3://{bucket}/{key} ({response['ContentLength']} bytes)")
        return True
    except ClientError as error:
        if str(error.response.get("Error", {}).get("Code", "")) in {"404", "NoSuchKey", "NotFound"}:
            return False
        raise


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def build_archive(output_path):
    model_info = HfApi().model_info(MODEL_ID)
    revision = model_info.sha
    snapshot_path = Path(snapshot_download(
        repo_id=MODEL_ID,
        revision=revision,
        allow_patterns=MODEL_FILES,
    ))

    with tempfile.TemporaryDirectory(prefix="sentiment-model-") as staging_directory:
        staging = Path(staging_directory)
        for source in snapshot_path.iterdir():
            if source.is_file():
                shutil.copy2(source, staging / source.name)
        (staging / "model-manifest.json").write_text(
            json.dumps({"model_id": MODEL_ID, "revision": revision}, indent=2),
            encoding="utf-8",
        )
        code_directory = staging / "code"
        code_directory.mkdir()
        (code_directory / "inference.py").write_text(INFERENCE_HANDLER, encoding="utf-8")
        with tarfile.open(output_path, "w:gz") as archive:
            for source in sorted(staging.iterdir()):
                archive.add(source, arcname=source.name)
    return revision


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--region", required=True)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--key", required=True)
    args = parser.parse_args()

    s3 = boto3.client("s3", region_name=args.region)
    ensure_bucket(s3, args.bucket, args.region)
    if object_exists(s3, args.bucket, args.key):
        return

    with tempfile.TemporaryDirectory(prefix="model-package-") as directory:
        archive_path = Path(directory) / "model.tar.gz"
        revision = build_archive(archive_path)
        checksum = sha256(archive_path)
        s3.upload_file(
            str(archive_path),
            args.bucket,
            args.key,
            ExtraArgs={
                "ServerSideEncryption": "AES256",
                "Metadata": {
                    "model-id": MODEL_ID,
                    "model-revision": revision,
                    "sha256": checksum,
                },
            },
        )
        print(json.dumps({
            "uri": f"s3://{args.bucket}/{args.key}",
            "model_id": MODEL_ID,
            "revision": revision,
            "sha256": checksum,
            "size_bytes": archive_path.stat().st_size,
        }, indent=2))


if __name__ == "__main__":
    main()
