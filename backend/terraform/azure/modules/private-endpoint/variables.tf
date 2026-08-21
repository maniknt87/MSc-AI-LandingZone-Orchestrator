variable "resource_group_name" {
  description = "Resource group for the Private Endpoint"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "private_endpoint_name" {
  description = "Name of the Private Endpoint"
  type        = string
}

variable "subnet_id" {
  description = "Subnet where the Private Endpoint will be deployed"
  type        = string
}

variable "private_connection_resource_id" {
  description = "Resource ID of the Azure service"
  type        = string
}

variable "subresource_names" {
  description = "Subresource names exposed by the Azure service"
  type        = list(string)
}

variable "private_dns_zone_id" {
  description = "Private DNS Zone resource ID"
  type        = string
}

variable "tags" {
  description = "Tags applied to the Private Endpoint"
  type        = map(string)
  default     = {}
}