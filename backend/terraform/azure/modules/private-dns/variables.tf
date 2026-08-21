variable "resource_group_name" {
  description = "Resource group for the Private DNS Zone"
  type        = string
}

variable "zone_name" {
  description = "Private DNS zone name"
  type        = string
}

variable "vnet_id" {
  description = "VNet to link to the Private DNS Zone"
  type        = string
}

variable "tags" {
  description = "Tags applied to the Private DNS Zone"
  type        = map(string)
  default     = {}
}