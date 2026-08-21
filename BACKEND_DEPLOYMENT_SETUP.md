# Dual-cloud deployment setup

The frontend sends one governed deployment request to FastAPI. The backend uses
the trusted `cloud` value to queue exactly one Azure DevOps pipeline:

- `Azure` -> `azure-pipelines.yml`
- `AWS` -> `aws-pipelines.yml`

Pipeline IDs are configured on the administrator onboarding page. The PAT is
kept in backend memory and is never returned to the browser. For a hosted
environment, store the credential in a secret store and replace this temporary
runtime storage.

## 1. Azure DevOps

1. Create two YAML pipelines in the same organization/project, one pointing to
   `azure-pipelines.yml` and one to `aws-pipelines.yml`.
2. Copy both numeric pipeline IDs into **Administration > Azure DevOps**.
3. Use a PAT with only the pipeline read/run permission needed by the REST API.
   Store it in Azure Key Vault (or an equivalent secret store) for production.
4. Install Terraform, Python 3, Azure CLI and AWS CLI on `devops-lin-agent`.
5. Install the AWS Toolkit for Azure DevOps so `AWSShellScript@1` is available.
6. Create Azure DevOps environments `aws-development`, `aws-testing` and
   `aws-production`; put an explicit approval check on production.

## 2. Azure target

1. Create an Azure Resource Manager service connection named
   `Azure-Terraform-Free-Connection`. Workload identity federation is preferred
   over a client secret.
2. Grant its identity only the roles required by the Terraform resources,
   remote-state storage and Azure Machine Learning deployment. The current
   bootstrap also needs permission to create the state resource group/account.
3. Confirm regional resource-provider registrations, Azure ML/compute quota and
   the selected VM SKU availability.
4. The repository currently deploys the `sentiment-analysis` workload only.
   Each additional catalogue model needs a tested model artifact, scoring
   handler and deployment script before it should be enabled in production.

## 3. AWS target

1. Create the AWS service connection `AWS-Terraform-Connection` and authorize
   both the AWS YAML pipeline and its agent pool to use it.
2. Pre-create a private, encrypted, versioned S3 Terraform-state bucket and a
   DynamoDB lock table. Set pipeline variables `awsTfStateBucket` and
   `awsTfLockTable`; never commit account credentials.
3. Grant the pipeline role least-privilege access for the Terraform state plus
   the VPC, Transit Gateway, Network Firewall, IAM, CloudWatch and SageMaker
   resources declared by the project.
4. Create a SageMaker execution role that SageMaker can assume and that can read
   the model artifact from its private S3 bucket and pull the approved inference
   image.
5. Supply a SageMaker-compatible `model.tar.gz`, inference handler, approved ECR
   image URI, endpoint configuration and health test. These artifacts do not yet
   exist in this repository, so the current AWS pipeline deploys the governed
   landing-zone infrastructure but not a SageMaker endpoint.
6. Confirm SageMaker endpoint quota and availability for each governed instance
   type and region.

## 4. End-to-end acceptance test

1. Save and verify both pipeline IDs on the onboarding page.
2. Submit an Azure Development deployment and verify that only the Azure
   pipeline queues and resources appear in the selected Azure subscription.
3. Submit an AWS Development deployment and verify that only the AWS pipeline
   queues and resources/state appear in the selected AWS account.
4. Select a non-approved region or compute size and verify that FastAPI rejects
   it before either pipeline is queued.
5. Validate idempotency with a second plan, then test destroy in a disposable
   account/subscription.
