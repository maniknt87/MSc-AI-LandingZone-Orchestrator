output "vnet_id" {
  value = azurerm_virtual_network.spoke.id
}

output "vnet_name" {
  value = azurerm_virtual_network.spoke.name
}

output "address_space" {
  value = azurerm_virtual_network.spoke.address_space
}

output "subnet_ids" {
  value = {
    for name, subnet in azurerm_subnet.spoke :
    name => subnet.id
  }
}