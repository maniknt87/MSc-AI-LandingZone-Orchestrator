# ==========================================
# SQLite Database Configuration
# ==========================================

import sqlite3
from pathlib import Path


# ------------------------------------------
# Database Location
# ------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

DATABASE_FILE = BASE_DIR / "platform.db"


# ------------------------------------------
# Database Connection
# ------------------------------------------

def get_connection():

    connection = sqlite3.connect(
        DATABASE_FILE
    )

    connection.row_factory = sqlite3.Row

    return connection


# ------------------------------------------
# Initialize Database
# ------------------------------------------

def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()

    # --------------------------------------
    # Users
    # --------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            username TEXT UNIQUE NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password_hash TEXT NOT NULL,

            role TEXT NOT NULL DEFAULT 'Read Only',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
        """
    )

    # --------------------------------------
    # Multi-Cloud Role Mapping
    # --------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS user_cloud_roles (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL,

            cloud TEXT NOT NULL,

            account_name TEXT NOT NULL,

            account_id TEXT,

            cloud_role TEXT NOT NULL,

            FOREIGN KEY (user_id)
                REFERENCES users(id)

        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS deployments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cloud TEXT NOT NULL,
            workload TEXT NOT NULL,
            environment TEXT NOT NULL,
            region TEXT NOT NULL,
            status TEXT NOT NULL,
            pipeline_name TEXT NOT NULL,
            pipeline_definition_id TEXT,
            pipeline_run_id TEXT NOT NULL,
            pipeline_url TEXT,
            provider TEXT NOT NULL,
            result TEXT,
            sync_error TEXT,
            created_time TEXT NOT NULL,
            updated_time TEXT NOT NULL,
            finished_time TEXT
        )
        """
    )

    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status)"
    )
    cursor.execute("PRAGMA table_info(deployments)")
    deployment_columns = {column["name"] for column in cursor.fetchall()}
    if "action" not in deployment_columns:
        cursor.execute("ALTER TABLE deployments ADD COLUMN action TEXT NOT NULL DEFAULT 'apply'")
    if "request_payload" not in deployment_columns:
        cursor.execute("ALTER TABLE deployments ADD COLUMN request_payload TEXT")
    if "parent_deployment_id" not in deployment_columns:
        cursor.execute("ALTER TABLE deployments ADD COLUMN parent_deployment_id INTEGER")
    if "retry_of_deployment_id" not in deployment_columns:
        cursor.execute("ALTER TABLE deployments ADD COLUMN retry_of_deployment_id INTEGER")

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS inference_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            cloud TEXT NOT NULL DEFAULT 'Azure',
            endpoint_name TEXT NOT NULL,
            deployment_name TEXT NOT NULL,
            workload TEXT NOT NULL,
            input_preview TEXT NOT NULL,
            prediction TEXT,
            confidence REAL,
            latency_ms INTEGER NOT NULL,
            status TEXT NOT NULL,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute("PRAGMA table_info(inference_runs)")
    inference_columns = {column["name"] for column in cursor.fetchall()}
    if "cloud" not in inference_columns:
        cursor.execute(
            "ALTER TABLE inference_runs ADD COLUMN cloud TEXT NOT NULL DEFAULT 'Azure'"
        )

        # --------------------------------------
    # Add Allowed Region to Existing Users
    # --------------------------------------

    cursor.execute(
        "PRAGMA table_info(users)"
    )

    columns = [
        column["name"]
        for column in cursor.fetchall()
    ]

    if "allowed_region" not in columns:

        cursor.execute(
            """
            ALTER TABLE users
            ADD COLUMN allowed_region TEXT
            DEFAULT 'All approved regions'
            """
        )
        
    connection.commit()

    connection.close()
