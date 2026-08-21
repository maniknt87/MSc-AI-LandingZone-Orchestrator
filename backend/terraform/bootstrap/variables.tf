variable "location" {
  description = "Azure region for Terraform state resources"
  type        = string
  default     = "centralindia"
}

variable "resource_group_name" {
  description = "Resource group for Terraform state"
  type        = string
  default     = "rg-terraform-state"
}

variable "storage_account_name" {
  description = "Globally unique Azure Storage Account name"
  type        = string
}

variable "container_name" {
  description = "Blob container for Terraform state"
  type        = string
  default     = "tfstate"
}