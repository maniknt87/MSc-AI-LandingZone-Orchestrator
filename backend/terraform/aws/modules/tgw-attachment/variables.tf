variable "name" {
  description = "Name of the Transit Gateway attachment"
  type        = string
}

variable "transit_gateway_id" {
  description = "Transit Gateway ID"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID to attach"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs used for the Transit Gateway attachment"
  type        = list(string)
}

variable "tags" {
  description = "Tags applied to the attachment"
  type        = map(string)
  default     = {}
}