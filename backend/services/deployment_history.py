from datetime import datetime

# ----------------------------------------
# In-Memory Deployment History
# ----------------------------------------

deployment_history = []


# ----------------------------------------
# Generate Deployment ID
# ----------------------------------------

def generate_deployment_id():

    deployment_number = len(deployment_history) + 1

    return f"DEP-{deployment_number:05d}"


# ----------------------------------------
# Save Deployment
# ----------------------------------------

def save_deployment(deployment, pipeline):

    deployment_record = {

        "deployment_id": generate_deployment_id(),

        "cloud": deployment.cloud,

        "workload": deployment.workload,

        "environment": deployment.environment,

        "region": deployment.region,

        "status": pipeline["status"],

        "pipeline_name": pipeline["pipeline_name"],

        "pipeline_id": pipeline["pipeline_id"],

        "provider": pipeline["provider"],

        "created_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    }

    deployment_history.append(deployment_record)

    return deployment_record


# ----------------------------------------
# Get Deployment History
# ----------------------------------------

def get_deployment_history():

    return deployment_history


# ----------------------------------------
# Update Deployment Status
# ----------------------------------------

def update_deployment_status(deployment_id, new_status):

    for deployment in deployment_history:

        if deployment["deployment_id"] == deployment_id:

            deployment["status"] = new_status

            return deployment

    return None


# ----------------------------------------
# Find Deployment
# ----------------------------------------

def get_deployment(deployment_id):

    for deployment in deployment_history:

        if deployment["deployment_id"] == deployment_id:

            return deployment

    return None