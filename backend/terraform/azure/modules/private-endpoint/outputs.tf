output "private_endpoint_id" {
  value = azurerm_private_endpoint.this.id
}

output "private_endpoint_name" {
  value = azurerm_private_endpoint.this.name
}

output "private_ip_addresses" {
  value = azurerm_private_endpoint.this.private_service_connection[*].private_ip_address
}