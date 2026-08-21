import subprocess
from pathlib import Path

from config.settings import TERRAFORM_DIRECTORY


# ----------------------------------------------------
# Terraform Directory Selection
# ----------------------------------------------------

def get_terraform_directory(deployment):
    """
    Select the Terraform configuration based on the
    cloud selected in the deployment request.
    """

    cloud = str(deployment.cloud).strip().lower()

    if cloud == "azure":
        terraform_directory = Path(TERRAFORM_DIRECTORY) / "azure"

    elif cloud in ("aws", "amazon web services"):
        terraform_directory = Path(TERRAFORM_DIRECTORY) / "aws"

    else:
        raise ValueError(
            f"Unsupported cloud provider: {deployment.cloud}"
        )

    if not terraform_directory.exists():
        raise FileNotFoundError(
            f"Terraform directory not found: {terraform_directory}"
        )

    return terraform_directory


# ----------------------------------------------------
# Execute Terraform Command
# ----------------------------------------------------

def run_terraform_command(command, terraform_directory):
    """
    Execute a Terraform command inside the selected
    cloud-specific Terraform directory.
    """

    result = subprocess.run(
        command,
        cwd=terraform_directory,
        capture_output=True,
        text=True,
        shell=True,
    )

    return {
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "directory": str(terraform_directory),
        "command": command,
    }


# ----------------------------------------------------
# Terraform Init
# ----------------------------------------------------

def terraform_init(terraform_directory):

    return run_terraform_command(
        "terraform init",
        terraform_directory,
    )


# ----------------------------------------------------
# Terraform Validate
# ----------------------------------------------------

def terraform_validate(terraform_directory):

    return run_terraform_command(
        "terraform validate",
        terraform_directory,
    )


# ----------------------------------------------------
# AWS Region Mapping
# ----------------------------------------------------

def get_aws_region(region):
    """
    Convert the friendly region name used by the UI
    into an AWS region identifier.

    If the UI already supplies an AWS region identifier,
    it is returned unchanged.
    """

    region_mapping = {
        "South India": "ap-south-1",
        "Mumbai": "ap-south-1",
        "US East (N. Virginia)": "us-east-1",
        "N. Virginia": "us-east-1",
        "Europe (Ireland)": "eu-west-1",
        "Ireland": "eu-west-1",
    }

    return region_mapping.get(
        region,
        region,
    )


# ----------------------------------------------------
# Terraform Plan
# ----------------------------------------------------

def terraform_plan(deployment, terraform_directory):

    cloud = str(deployment.cloud).strip().lower()

    # ------------------------------------------------
    # Azure
    # ------------------------------------------------

    if cloud == "azure":

        command = (
            'terraform plan '
            '-input=false '
            '-no-color '
            f'-var="cloud={deployment.cloud}" '
            f'-var="workload={deployment.workload}" '
            f'-var="environment={deployment.environment}" '
            f'-var="region={deployment.region}" '
            f'-var="vmSize={deployment.vmSize}" '
            f'-var="storageType={deployment.storageType}" '
            f'-var="enableBackup={str(deployment.enableBackup).lower()}" '
            f'-var="enableMonitoring={str(deployment.enableMonitoring).lower()}" '
            f'-var="enableAvailabilityZone={str(deployment.enableAvailabilityZone).lower()}" '
            f'-var="enablePrivateEndpoint={str(deployment.enablePrivateEndpoint).lower()}" '
            f'-var="enablePublicIP={str(deployment.enablePublicIP).lower()}'
        )

    # ------------------------------------------------
    # AWS
    # ------------------------------------------------

    elif cloud in ("aws", "amazon web services"):

        aws_region = get_aws_region(deployment.region)

        command = (
            'terraform plan '
            '-input=false '
            '-no-color '
            f'-var="aws_region={aws_region}" '
            f'-var="environment={deployment.environment}" '
            f'-var="platform_name={deployment.workload}"'
        )

    else:

        raise ValueError(
            f"Unsupported cloud provider: {deployment.cloud}"
        )

    return run_terraform_command(
        command,
        terraform_directory,
    )


# ----------------------------------------------------
# Complete Terraform Workflow
# ----------------------------------------------------

def execute_terraform(deployment):

    try:

        # --------------------------------------------
        # Select cloud-specific Terraform directory
        # --------------------------------------------

        terraform_directory = get_terraform_directory(
            deployment
        )

        # --------------------------------------------
        # Terraform Init
        # --------------------------------------------

        init_result = terraform_init(
            terraform_directory
        )

        if not init_result["success"]:

            return {
                "status": "FAILED",
                "step": "terraform init",
                "result": init_result,
            }

        # --------------------------------------------
        # Terraform Validate
        # --------------------------------------------

        validate_result = terraform_validate(
            terraform_directory
        )

        if not validate_result["success"]:

            return {
                "status": "FAILED",
                "step": "terraform validate",
                "result": validate_result,
            }

        # --------------------------------------------
        # Terraform Plan
        # --------------------------------------------

        plan_result = terraform_plan(
            deployment,
            terraform_directory,
        )

        if not plan_result["success"]:

            return {
                "status": "FAILED",
                "step": "terraform plan",
                "result": plan_result,
            }

        # --------------------------------------------
        # Successful Plan
        # --------------------------------------------

        return {

            "status": "SUCCESS",

            "message": (
                "Terraform initialization, validation "
                "and plan completed successfully."
            ),

            "terraform": {

                "directory": str(terraform_directory),

                "init": init_result,

                "validate": validate_result,

                "plan": plan_result,

            },

        }

    except Exception as error:

        return {

            "status": "FAILED",

            "step": "terraform execution",

            "message": str(error),

        }