variable "resource_group_name" {
  description = "Resource group for AI resources"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "workspace_name" {
  description = "Azure Machine Learning workspace name"
  type        = string
}

variable "storage_account_id" {
  description = "Existing AI Storage Account resource ID"
  type        = string
}

variable "key_vault_name" {
  description = "Azure Key Vault name"
  type        = string
}

variable "application_insights_name" {
  description = "Application Insights name"
  type        = string
}

variable "private_endpoint_subnet_id" {
  description = "Existing AI private endpoint subnet"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Existing central Log Analytics workspace"
  type        = string
}

variable "ai_vnet_id" {
  description = "Existing AI spoke VNet ID"
  type        = string
}

variable "acr_name" {
  description = "Azure Container Registry name"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
}