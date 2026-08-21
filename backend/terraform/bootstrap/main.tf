resource "azurerm_resource_group" "terraform_state" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    ManagedBy = "Terraform"
    Purpose   = "Terraform Remote State"
    Platform  = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
  }
}

resource "azurerm_storage_account" "terraform_state" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.terraform_state.name
  location                 = azurerm_resource_group.terraform_state.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  min_tls_version = "TLS1_2"

  public_network_access_enabled = true

  tags = {
    ManagedBy = "Terraform"
    Purpose   = "Terraform Remote State"
    Platform  = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
  }
}

resource "azurerm_storage_container" "terraform_state" {
  name                  = var.container_name
  storage_account_id    = azurerm_storage_account.terraform_state.id
  container_access_type = "private"
}