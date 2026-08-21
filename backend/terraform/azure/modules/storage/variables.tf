variable "resource_group_name" {
  description = "Resource group for the Storage Account"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "storage_account_name" {
  description = "Globally unique Storage Account name"
  type        = string
}

variable "tags" {
  description = "Tags applied to the Storage Account"
  type        = map(string)
  default     = {}
}