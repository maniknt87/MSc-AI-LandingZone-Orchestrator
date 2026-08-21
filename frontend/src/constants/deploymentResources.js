export const deploymentResources = {

  Azure: {

    General: [
      "Resource Group",
      "Virtual Network",
      "Subnets",
      "Network Security Group",
      "Route Table",
      "Azure Bastion",
      "Azure Firewall",
      "Storage Account",
      "Azure SQL Database",
      "Log Analytics Workspace"
    ],

    AI: [
      "Resource Group",
      "Virtual Network",
      "Private Endpoint",
      "Azure Kubernetes Service",
      "Azure Container Registry",
      "Azure AI Foundry",
      "Azure Key Vault",
      "Azure Monitor",
      "Log Analytics Workspace",
      "Application Insights"
    ]

  },

  AWS: {

    General: [
      "VPC",
      "Public Subnet",
      "Private Subnet",
      "Internet Gateway",
      "NAT Gateway",
      "EC2",
      "Application Load Balancer",
      "RDS",
      "CloudWatch",
      "IAM Roles"
    ],

    AI: [
      "VPC",
      "Private Subnets",
      "Amazon EKS",
      "Amazon ECR",
      "Amazon SageMaker",
      "Secrets Manager",
      "CloudWatch",
      "IAM Roles",
      "Application Load Balancer",
      "CloudTrail"
    ]

  }

};