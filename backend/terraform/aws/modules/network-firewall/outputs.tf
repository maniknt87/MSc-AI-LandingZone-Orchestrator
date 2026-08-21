output "stateful_rule_group_arn" {
  value = aws_networkfirewall_rule_group.stateful.arn
}

output "firewall_policy_arn" {
  value = aws_networkfirewall_firewall_policy.this.arn
}

output "firewall_id" {
  value = aws_networkfirewall_firewall.this.id
}

output "firewall_arn" {
  value = aws_networkfirewall_firewall.this.arn
}
output "firewall_endpoint_ids" {
  value = {
    for sync_state in aws_networkfirewall_firewall.this.firewall_status[0].sync_states :
    sync_state.availability_zone => sync_state.attachment[0].endpoint_id
  }
}