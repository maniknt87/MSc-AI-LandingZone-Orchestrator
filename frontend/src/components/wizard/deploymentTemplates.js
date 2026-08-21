export const deploymentTemplates = [
  {
    id: "azure-general-dev",
    cloud: "Azure",
    name: "Azure General Development",
    description: "Standard Azure landing zone for development workloads.",
    workload: "General",
    environment: "Development",
    vmSize: "Standard_B2s",
    storageType: "Standard_LRS",
    enableBackup: true,
    enableMonitoring: true,
    enableAvailabilityZone: false,
    enablePrivateEndpoint: true,
    enablePublicIP: false
  },

  {
    id: "azure-general-prod",
    cloud: "Azure",
    name: "Azure General Production",
    description: "Standard Azure landing zone for production workloads.",
    workload: "General",
    environment: "Production",
    vmSize: "Standard_D2s_v5",
    storageType: "Premium_LRS",
    enableBackup: true,
    enableMonitoring: true,
    enableAvailabilityZone: true,
    enablePrivateEndpoint: true,
    enablePublicIP: false
  },

  {
    id: "azure-ai-dev",
    cloud: "Azure",
    name: "Azure AI Development",
    description: "Azure landing zone for AI development workloads.",
    workload: "AI",
    environment: "Development",
    vmSize: "Standard_NC4as_T4_v3",
    storageType: "Standard_LRS",
    enableBackup: true,
    enableMonitoring: true,
    enableAvailabilityZone: false,
    enablePrivateEndpoint: true,
    enablePublicIP: false
  },

  {
    id: "aws-general-dev",
    cloud: "AWS",
    name: "AWS General Development",
    description: "Standard AWS landing zone for development workloads.",
    workload: "General",
    environment: "Development",
    vmSize: "t3.medium",
    storageType: "gp3",
    enableBackup: true,
    enableMonitoring: true,
    enableAvailabilityZone: false,
    enablePrivateEndpoint: true,
    enablePublicIP: false
  },

  {
    id: "aws-general-prod",
    cloud: "AWS",
    name: "AWS General Production",
    description: "Standard AWS landing zone for production workloads.",
    workload: "General",
    environment: "Production",
    vmSize: "t3.large",
    storageType: "gp3",
    enableBackup: true,
    enableMonitoring: true,
    enableAvailabilityZone: true,
    enablePrivateEndpoint: true,
    enablePublicIP: false
  },

  {
    id: "aws-ai-dev",
    cloud: "AWS",
    name: "AWS AI Development",
    description: "AWS landing zone for AI development workloads.",
    workload: "AI",
    environment: "Development",
    vmSize: "g4dn.xlarge",
    storageType: "gp3",
    enableBackup: true,
    enableMonitoring: true,
    enableAvailabilityZone: false,
    enablePrivateEndpoint: true,
    enablePublicIP: false
  }
];