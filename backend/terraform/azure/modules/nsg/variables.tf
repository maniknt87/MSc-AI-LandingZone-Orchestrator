variable "resource_group_name" {
  description = "Resource group where the NSG will be created"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "nsg_name" {
  description = "Name of the Network Security Group"
  type        = string
}

variable "tags" {
  description = "Tags applied to the NSG"
  type        = map(string)
  default     = {}
}
variable "rules" {
  description = "Network security rules for the NSG"

  type = map(object({
    priority                   = number
    direction                  = string
    access                     = string
    protocol                   = string
    source_port_range          = string
    destination_port_range     = string
    source_address_prefix      = string
    destination_address_prefix = string
  }))

  default = {}
}