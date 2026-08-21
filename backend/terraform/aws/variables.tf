variable "aws_region" {
  description = "AWS region for the Landing Zone"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "Development"
}

variable "platform_name" {
  description = "Name of the multi-cloud platform"
  type        = string
  default     = "Multi-Cloud Governance and Landing Zone Orchestration Platform"
}

variable "deployment_name" {
  type = string
}
variable "workload" {
  type = string
}
variable "model_id" {
  type = string
}
variable "model_name" {
  type = string
}
variable "instance_type" {
  type = string
}
variable "hub_address_space" {
  type = string
}
variable "general_spoke_address_space" {
  type = string
}
variable "ai_spoke_address_space" {
  type = string
}
variable "enable_monitoring" {
  type = bool
}
variable "enable_private_endpoint" {
  type = bool
}
