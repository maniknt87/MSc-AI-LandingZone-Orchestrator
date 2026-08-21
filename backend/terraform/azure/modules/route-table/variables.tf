variable "resource_group_name" {
  description = "Resource group for the route table"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "route_table_name" {
  description = "Name of the route table"
  type        = string
}

variable "firewall_private_ip" {
  description = "Private IP address of the Azure Firewall"
  type        = string
}

variable "tags" {
  description = "Tags applied to the route table"
  type        = map(string)
  default     = {}
}