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

    # --------------------------------------
    # Model Playground Invocation History
    # --------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS inference_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
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
