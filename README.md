# AI Landing Zone Self-Service Platform

This capstone demonstrates a simple, governed deployment journey:

```text
Customer UI → FastAPI validation/governance → Azure DevOps REST API
            → Azure or AWS YAML pipeline → Terraform landing zone → AI model
```

The browser never receives cloud credentials or an Azure DevOps PAT. FastAPI validates governance and network inputs, then routes Azure requests to `azure-pipelines.yml` and AWS requests to `aws-pipelines.yml`. The pipelines are the only components that run Terraform, giving an auditable deployment path.

## Customer demo story

1. Select Azure, an AI workload, model, environment, and region.
2. Enter a landing-zone name and three private, non-overlapping `/16` address spaces.
3. Select security controls and review the request.
4. Click **Provision Landing Zone**.
5. The API applies governance checks and queues Azure DevOps.
6. Azure DevOps creates remote state, plans and applies Terraform, then deploys the selected AI workload.

Administrators configure both cloud pipeline IDs from **Azure DevOps** in the application navigation. The onboarding form verifies the organization, project, Azure pipeline, AWS pipeline, branch and PAT before storing the connection in backend process memory. The PAT is never returned to the frontend or stored in browser storage. Environment variables remain available as a fallback after a backend restart.

## Local setup

### Backend

Create and activate a Python virtual environment, then:

```powershell
pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
uvicorn app:app --app-dir backend --reload
```

Set the `AZDO_*` values in your process environment (or load `backend/.env` in your hosting platform). Use a secret variable or Key Vault reference for `AZDO_PAT`; never commit it.

Alternatively, sign in as an Administrator and use the Azure DevOps onboarding page. For a production deployment, replace its in-memory secret store with Azure Key Vault.

The PAT needs the minimum Azure DevOps permission required to queue pipeline runs. The pipeline's Azure service connection remains responsible for Azure authentication.

### Frontend

```powershell
npm install --prefix frontend
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev --prefix frontend
```

Sign in using the existing application login, open **Deployment Planner**, and submit a request.

## Azure DevOps configuration

1. Create separate pipelines pointing at `azure-pipelines.yml` and `aws-pipelines.yml`.
2. Configure the existing `Azure-Terraform-Free-Connection` service connection or replace that name in YAML.
3. Run the pipeline agent with Terraform, Azure CLI, and Python 3 installed.
4. Put both pipeline IDs, organization, project, branch, and PAT in the backend environment.
5. Ensure the service connection can create resource groups and the Terraform-state storage resources.

See [BACKEND_DEPLOYMENT_SETUP.md](BACKEND_DEPLOYMENT_SETUP.md) for the complete Azure and AWS prerequisites and acceptance test.

UI values are mapped one-to-one to YAML template parameters, then to Terraform variables:

| UI | Pipeline parameter | Terraform variable |
|---|---|---|
| Landing zone name | `deploymentName` | `deployment_name` |
| Environment | `environment` | `environment` |
| Azure region | `region` | `region` |
| Hub CIDR | `hubAddressSpace` | `hub_address_space` |
| General spoke CIDR | `generalSpokeAddressSpace` | `general_spoke_address_space` |
| AI spoke CIDR | `aiSpokeAddressSpace` | `ai_spoke_address_space` |
| Model ID/name | `modelId` / `modelName` | `model_id` / `model_name` |

## Important production improvements

This is a customer-explainable capstone baseline. Before production use, add Microsoft Entra authentication for the UI/API, store deployment history in a durable database, replace the PAT with a managed identity or short-lived credential where supported, add pipeline approvals for production, and run private model deployment from an agent with network access to the isolated Azure ML workspace.
