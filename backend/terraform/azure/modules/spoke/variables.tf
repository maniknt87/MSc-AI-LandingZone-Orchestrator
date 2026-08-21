variable "resource_group_name" {
  description = "Resource group for the spoke VNet"
  type        = string
}

variable "location" {
  description = "Azure region for the spoke VNet"
  type        = string
}

variable "vnet_name" {
  description = "Name of the spoke VNet"
  type        = string
}

variable "address_space" {
  description = "Address space for the spoke VNet"
  type        = list(string)
}

variable "hub_vnet_id" {
  description = "Resource ID of the Hub VNet"
  type        = string
}

variable "subnets" {
  description = "Subnet definitions for the spoke"
  type = map(object({
    address_prefix = string
  }))
}