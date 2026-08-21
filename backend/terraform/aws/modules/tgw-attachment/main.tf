resource "aws_ec2_transit_gateway_vpc_attachment" "this" {
  subnet_ids             = var.subnet_ids
  transit_gateway_id     = var.transit_gateway_id
  vpc_id                 = var.vpc_id
  appliance_mode_support = "enable"

  dns_support = "enable"

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}