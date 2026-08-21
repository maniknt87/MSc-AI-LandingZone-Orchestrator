variable "cloud" {
  description = "Target cloud platform"
  type        = string
  default     = "Azure"
}

variable "workload" {
  description = "Workload type"
  type        = string
  default     = "General"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "Development"
}

variable "region" {
  description = "Deployment region"
  type        = string
  default     = "Central India"
}

variable "vmSize" {
  description = "Virtual machine size"
  type        = string
  default     = "Standard_B2s"
}

variable "storageType" {
  description = "Storage SKU/type"
  type        = string
  default     = "Standard_LRS"
}

variable "enableBackup" {
  description = "Enable backup"
  type        = bool
  default     = true
}

variable "enableMonitoring" {
  description = "Enable Azure monitoring"
  type        = bool
  default     = true
}

variable "enableAvailabilityZone" {
  description = "Enable availability zone"
  type        = bool
  default     = true
}

variable "enablePrivateEndpoint" {
  description = "Enable private endpoint"
  type        = bool
  default     = true
}

variable "enablePublicIP" {
  description = "Enable public IP"
  type        = bool
  default     = false
}

variable "deployment_name" {
  description = "Customer-friendly landing zone name"
  type        = string
  default     = "ai-landing-zone"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]{2,29}$", var.deployment_name))
    error_message = "deployment_name must be 3-30 letters, numbers, or hyphens and start with a letter."
  }
}

variable "hub_address_space" {
  description = "Hub virtual network CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "general_spoke_address_space" {
  description = "General workload spoke CIDR"
  type        = string
  default     = "10.1.0.0/16"
}

variable "ai_spoke_address_space" {
  description = "AI workload spoke CIDR"
  type        = string
  default     = "10.2.0.0/16"
}

variable "model_id" {
  description = "Model identifier selected in the portal"
  type        = string
  default     = ""
}

variable "model_name" {
  description = "Model display name selected in the portal"
  type        = string
  default     = ""
}
