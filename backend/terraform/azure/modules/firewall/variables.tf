variable "resource_group_name" {
  description = "Resource group containing the Hub"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "firewall_name" {
  description = "Azure Firewall name"
  type        = string
}

variable "subnet_id" {
  description = "AzureFirewallSubnet resource ID"
  type        = string
}

variable "tags" {
  description = "Tags applied to the firewall"
  type        = map(string)
  default     = {}
}
variable "firewall_policy_id" {
  description = "Resource ID of the Azure Firewall Policy"
  type        = string
}