variable "name" {
  description = "Name of the Transit Gateway"
  type        = string
}

variable "amazon_side_asn" {
  description = "Private ASN for the Transit Gateway"
  type        = number
  default     = 64512
}

variable "tags" {
  description = "Tags for the Transit Gateway"
  type        = map(string)
  default     = {}
}