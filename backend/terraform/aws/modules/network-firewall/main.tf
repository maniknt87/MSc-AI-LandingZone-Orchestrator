resource "aws_networkfirewall_rule_group" "stateful" {
  capacity = 100
  name     = "${var.name}-stateful"
  type     = "STATEFUL"

  rule_group {
    stateful_rule_options {
      rule_order = "STRICT_ORDER"
    }

    rules_source {
      rules_string = <<-EOT
        pass tcp 10.11.0.0/16 any -> 10.12.0.0/16 443 (msg:"Allow General to AI HTTPS"; sid:1001; rev:1;)
        pass tcp 10.12.0.0/16 any -> 10.11.0.0/16 443 (msg:"Allow AI to General HTTPS"; sid:1002; rev:1;)
      EOT
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-stateful"
    }
  )
}

resource "aws_networkfirewall_firewall_policy" "this" {
  name = "${var.name}-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]

    stateful_engine_options {
      rule_order = "STRICT_ORDER"
    }

    stateful_rule_group_reference {
      priority     = 100
      resource_arn = aws_networkfirewall_rule_group.stateful.arn
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-policy"
    }
  )
}

resource "aws_networkfirewall_firewall" "this" {
  name                = var.name
  firewall_policy_arn = aws_networkfirewall_firewall_policy.this.arn
  vpc_id              = var.vpc_id

  subnet_mapping {
    subnet_id = var.firewall_subnet_ids[0]
  }

  subnet_mapping {
    subnet_id = var.firewall_subnet_ids[1]
  }

  delete_protection                 = false
  firewall_policy_change_protection = false
  subnet_change_protection          = false

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}