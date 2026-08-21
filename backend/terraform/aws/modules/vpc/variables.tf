variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "enable_dns_support" {
  description = "Enable DNS resolution in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to the VPC"
  type        = map(string)
  default     = {}
}
variable "subnets" {
  description = "Subnet definitions for the VPC"
  type = map(object({
    cidr_block        = string
    availability_zone = string
    type              = string
  }))
  default = {}
}