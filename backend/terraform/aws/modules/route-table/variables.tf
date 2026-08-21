variable "name" {
  description = "Name of the route table"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "transit_gateway_id" {
  description = "Transit Gateway ID"
  type        = string
}

variable "tags" {
  description = "Tags applied to the route table"
  type        = map(string)
  default     = {}
}

variable "destination_cidr" {
  description = "Destination CIDR block for the route"
  type        = string
}