resource "aws_route_table" "this" {
  vpc_id = var.vpc_id

  route {
    cidr_block         = var.destination_cidr
    transit_gateway_id = var.transit_gateway_id
  }

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}

