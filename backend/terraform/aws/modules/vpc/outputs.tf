output "vpc_id" {
  value = aws_vpc.this.id
}

output "vpc_cidr_block" {
  value = aws_vpc.this.cidr_block
}

output "vpc_arn" {
  value = aws_vpc.this.arn
}
output "subnet_ids" {
  value = {
    for name, subnet in aws_subnet.this :
    name => subnet.id
  }
}