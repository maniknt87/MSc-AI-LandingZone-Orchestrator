variable "name" {
  description = "Name of the Network Firewall"
  type        = string
}

variable "vpc_id" {
  description = "Inspection VPC ID"
  type        = string
}

variable "firewall_subnet_ids" {
  description = "Subnets where Network Firewall endpoints will be deployed"
  type        = list(string)
}

variable "tags" {
  description = "Tags applied to Network Firewall resources"
  type        = map(string)
  default     = {}
}