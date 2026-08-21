variable "resource_group_name" {
  description = "Resource group for the Firewall Policy"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "policy_name" {
  description = "Azure Firewall Policy name"
  type        = string
}

variable "tags" {
  description = "Tags applied to the Firewall Policy"
  type        = map(string)
  default     = {}
}