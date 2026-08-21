import threading
import time

from services.deployment_history import update_deployment_status


# -----------------------------------------------------
# Background Deployment Lifecycle
# -----------------------------------------------------

def deployment_lifecycle(deployment_id):

    # Deployment Queued
    time.sleep(5)

    update_deployment_status(
        deployment_id,
        "Running"
    )

    # Deployment Running
    time.sleep(10)

    update_deployment_status(
        deployment_id,
        "Completed"
    )


# -----------------------------------------------------
# Start Background Deployment Thread
# -----------------------------------------------------

def start_deployment_lifecycle(deployment_id):

    thread = threading.Thread(
        target=deployment_lifecycle,
        args=(deployment_id,),
        daemon=True
    )

    thread.start()