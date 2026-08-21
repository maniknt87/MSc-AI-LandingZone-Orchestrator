# ==========================================
# Authentication Service
# ==========================================

import hashlib
import base64
import hashlib
import hmac
import json
import os
import time

from database.database import get_connection


# ------------------------------------------
# Authentication Configuration
# ------------------------------------------

AUTH_SECRET = os.getenv(
    "AUTH_SECRET",
    "multi-cloud-governance-demo-secret"
)

TOKEN_EXPIRY_SECONDS = 8 * 60 * 60


# ------------------------------------------
# Password Hashing
# ------------------------------------------

def hash_password(password):

    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


# ------------------------------------------
# Create Authentication Token
# ------------------------------------------

def create_access_token(user):

    payload = {
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "allowed_region": user["allowed_region"],
        "expires_at": int(
            time.time() + TOKEN_EXPIRY_SECONDS
        )
    }

    payload_json = json.dumps(
        payload,
        separators=(",", ":")
    ).encode("utf-8")

    payload_encoded = base64.urlsafe_b64encode(
        payload_json
    ).decode("utf-8").rstrip("=")

    signature = hmac.new(
        AUTH_SECRET.encode("utf-8"),
        payload_encoded.encode("utf-8"),
        hashlib.sha256
    ).digest()

    signature_encoded = base64.urlsafe_b64encode(
        signature
    ).decode("utf-8").rstrip("=")

    return (
        payload_encoded
        + "."
        + signature_encoded
    )


# ------------------------------------------
# Validate Authentication Token
# ------------------------------------------

def verify_access_token(token):

    try:

        parts = token.split(".")

        if len(parts) != 2:
            return None

        payload_encoded = parts[0]
        provided_signature = parts[1]

        expected_signature = hmac.new(
            AUTH_SECRET.encode("utf-8"),
            payload_encoded.encode("utf-8"),
            hashlib.sha256
        ).digest()

        expected_signature_encoded = (
            base64.urlsafe_b64encode(
                expected_signature
            )
            .decode("utf-8")
            .rstrip("=")
        )

        if not hmac.compare_digest(
            provided_signature,
            expected_signature_encoded
        ):
            return None

        padding = "=" * (
            4 - len(payload_encoded) % 4
        )

        payload_json = base64.urlsafe_b64decode(
            payload_encoded + padding
        )

        payload = json.loads(
            payload_json.decode("utf-8")
        )

        if payload["expires_at"] < int(time.time()):
            return None

        return payload

    except Exception:

        return None


# ------------------------------------------
# Create User
# ------------------------------------------

def create_user(
    username,
    email,
    password,
    role="Read Only",
    allowed_region="All approved regions"
):

    connection = get_connection()

    cursor = connection.cursor()

    password_hash = hash_password(password)

    try:

        cursor.execute(
            """
            INSERT INTO users (
                username,
                email,
                password_hash,
                role,
                allowed_region
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                username,
                email,
                password_hash,
                role,
                allowed_region
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "User created successfully."
        }

    except Exception as error:

        return {
            "success": False,
            "message": str(error)
        }

    finally:

        connection.close()


# ------------------------------------------
# Authenticate User
# ------------------------------------------

def authenticate_user(
    username,
    password
):

    connection = get_connection()

    cursor = connection.cursor()

    password_hash = hash_password(password)

    cursor.execute(
        """
        SELECT
            id,
            username,
            email,
            role,
            allowed_region
        FROM users
        WHERE username = ?
        AND password_hash = ?
        """,
        (
            username,
            password_hash
        )
    )

    user = cursor.fetchone()

    connection.close()

    if not user:

        return None

    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "allowed_region": user["allowed_region"]
    }