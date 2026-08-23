import json
import logging
import os
from pathlib import Path

from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline


logger = logging.getLogger(__name__)

classifier = None


def init():
    global classifier

    logger.info("Loading sentiment model...")

    model_root = os.environ.get("AZUREML_MODEL_DIR")
    if not model_root:
        raise RuntimeError("AZUREML_MODEL_DIR was not supplied by Azure ML.")
    model_directory = Path(model_root)
    if not (model_directory / "config.json").is_file():
        candidates = sorted(model_directory.rglob("config.json"))
        if len(candidates) != 1:
            raise RuntimeError(
                f"Expected one cached model below {model_directory}; "
                f"found {len(candidates)} config.json files."
            )
        model_directory = candidates[0].parent
    logger.info("Loading cached sentiment model from %s", model_directory)
    tokenizer = AutoTokenizer.from_pretrained(str(model_directory), local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(
        str(model_directory),
        local_files_only=True,
    )
    classifier = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)

    logger.info("Sentiment model loaded successfully.")


def run(raw_data):

    try:

        if isinstance(raw_data, str):
            data = json.loads(raw_data)
        else:
            data = raw_data

        text = data.get("text")

        if not text:
            return {
                "error": "Request must contain a 'text' field."
            }

        result = classifier(text)

        return {
            "label": result[0]["label"],
            "score": float(result[0]["score"]),
        }

    except Exception as exc:

        logger.exception(
            "Sentiment inference failed."
        )

        return {
            "error": str(exc)
        }
