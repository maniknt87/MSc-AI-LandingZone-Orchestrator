resource "aws_ec2_transit_gateway" "this" {
  description = var.name

  amazon_side_asn = var.amazon_side_asn

  dns_support = "enable"

  default_route_table_association = "enable"
  default_route_table_propagation = "enable"

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}