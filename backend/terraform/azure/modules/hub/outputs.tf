output "vnet_id" {
  value = azurerm_virtual_network.hub.id
}

output "vnet_name" {
  value = azurerm_virtual_network.hub.name
}

output "address_space" {
  value = azurerm_virtual_network.hub.address_space
}

output "firewall_subnet_id" {
  value = azurerm_subnet.firewall.id
}