import json
import logging

from transformers import pipeline


logger = logging.getLogger(__name__)

classifier = None


def init():
    global classifier

    logger.info("Loading sentiment model...")

    classifier = pipeline(
        "sentiment-analysis",
        model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
    )

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