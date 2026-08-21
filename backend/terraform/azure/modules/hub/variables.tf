variable "resource_group_name" {
  description = "Name of the Hub resource group"
  type        = string
}

variable "location" {
  description = "Azure region for the Hub"
  type        = string
}

variable "vnet_name" {
  description = "Name of the Hub VNet"
  type        = string
}

variable "address_space" {
  description = "Address space for the Hub VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}