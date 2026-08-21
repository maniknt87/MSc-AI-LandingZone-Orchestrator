from ipaddress import ip_network
from typing import Self

from pydantic import BaseModel, Field, model_validator


class DeploymentRequest(BaseModel):

    deploymentName: str = Field(
        default="ai-landing-zone",
        min_length=3,
        max_length=30,
        pattern=r"^[a-zA-Z][a-zA-Z0-9-]*$",
    )

    hubAddressSpace: str = "10.0.0.0/16"
    generalSpokeAddressSpace: str = "10.1.0.0/16"
    aiSpokeAddressSpace: str = "10.2.0.0/16"

    # ---------------------------------------
    # Deployment Configuration
    # ---------------------------------------

    cloud: str

    workload: str

    environment: str

    # Kept temporarily for backend compatibility.
    # Region is no longer selected in the AI Platform UI.
    region: str = ""

    # ---------------------------------------
    # AI Configuration
    # ---------------------------------------

    modelId: str = ""

    modelName: str = ""

    # ---------------------------------------
    # AI Security & Governance
    # ---------------------------------------

    enableIdentityGovernance: bool = True

    enableModelGovernance: bool = True

    # ---------------------------------------
    # Existing Platform Controls
    # ---------------------------------------

    enableBackup: bool = True

    enableMonitoring: bool = True

    enableAvailabilityZone: bool = True

    enablePrivateEndpoint: bool = True

    enablePublicIP: bool = False

    # ---------------------------------------
    # Legacy Infrastructure Fields
    # ---------------------------------------
    # Retained temporarily so the existing
    # Landing Zone deployment path remains
    # compatible while the AI platform is
    # being integrated.

    vmSize: str = ""

    storageType: str = ""

    @model_validator(mode="after")
    def validate_networks(self) -> Self:
        fields = (
            "hubAddressSpace",
            "generalSpokeAddressSpace",
            "aiSpokeAddressSpace",
        )
        networks = []
        for field in fields:
            value = getattr(self, field)
            try:
                network = ip_network(value, strict=True)
            except ValueError as error:
                raise ValueError(f"{field} must be a valid CIDR block: {error}") from error
            if network.version != 4 or network.prefixlen != 16:
                raise ValueError(f"{field} must be a private IPv4 /16 CIDR")
            if not network.is_private:
                raise ValueError(f"{field} must use private IPv4 address space")
            networks.append(network)

        for index, network in enumerate(networks):
            for other in networks[index + 1:]:
                if network.overlaps(other):
                    raise ValueError(
                        f"Landing-zone address spaces must not overlap: {network} and {other}"
                    )
        return self
