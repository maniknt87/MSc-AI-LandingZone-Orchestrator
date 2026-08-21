resource "azurerm_firewall_policy" "this" {
  name                = var.policy_name
  resource_group_name = var.resource_group_name
  location            = var.location

  sku = "Standard"

  tags = var.tags
}

resource "azurerm_firewall_policy_rule_collection_group" "network" {
  name               = "rcg-network-${lower(var.policy_name)}"
  firewall_policy_id = azurerm_firewall_policy.this.id
  priority           = 100

  network_rule_collection {
    name     = "allow-required-network"
    priority = 100
    action   = "Allow"

    rule {
      name                  = "allow-https-outbound"
      protocols             = ["TCP"]
      source_addresses      = ["10.1.0.0/16", "10.2.0.0/16"]
      destination_addresses = ["*"]
      destination_ports     = ["443"]
    }
  }
}