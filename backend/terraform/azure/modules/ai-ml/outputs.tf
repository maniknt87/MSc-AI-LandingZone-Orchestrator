output "workspace_id" {
  value = azurerm_machine_learning_workspace.this.id
}

output "workspace_name" {
  value = azurerm_machine_learning_workspace.this.name
}

output "workspace_principal_id" {
  value = azurerm_machine_learning_workspace.this.identity[0].principal_id
}

output "key_vault_id" {
  value = azurerm_key_vault.this.id
}

output "application_insights_id" {
  value = azurerm_application_insights.this.id
}

output "container_registry_id" {
  value = azurerm_container_registry.this.id
}

output "container_registry_login_server" {
  value = azurerm_container_registry.this.login_server
}

output "aml_private_endpoint_id" {
  value = azurerm_private_endpoint.aml_workspace.id
}