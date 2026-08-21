from fastapi import APIRouter

from config.settings import (
    ALLOWED_CLOUDS,
    ALLOWED_ENVIRONMENTS,
    ALLOWED_REGIONS,
    ALLOWED_WORKLOADS,
)
from services.policy_service import AI_COMPUTE_SIZES

router = APIRouter()


@router.get("/governance/settings")
def get_governance_settings():

    return {
        "clouds": ALLOWED_CLOUDS,
        "environments": ALLOWED_ENVIRONMENTS,
        "regions": ALLOWED_REGIONS,
        "workloads": ALLOWED_WORKLOADS,
        "compute_sizes": {
            cloud: {
                environment: sorted(sizes)
                for environment, sizes in environments.items()
            }
            for cloud, environments in AI_COMPUTE_SIZES.items()
        },
    }
