data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "this" {
  name                = var.key_vault_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name = "standard"

  purge_protection_enabled   = true
  soft_delete_retention_days = 7

  public_network_access_enabled = false

  tags = var.tags
}

resource "azurerm_application_insights" "this" {
  name                = var.application_insights_name
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"

  workspace_id = var.log_analytics_workspace_id

  tags = var.tags
}

resource "azurerm_container_registry" "this" {
  name                = var.acr_name
  location            = var.location
  resource_group_name = var.resource_group_name

  sku = "Premium"

  admin_enabled                 = false
  public_network_access_enabled = false

  network_rule_set {
    default_action = "Deny"
  }

  tags = var.tags
}

# ============================================================
# PRIVATE DNS - KEY VAULT
# ============================================================

resource "azurerm_private_dns_zone" "key_vault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "key_vault" {
  name                  = "ai-kv-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.key_vault.name
  resource_group_name   = var.resource_group_name
  virtual_network_id    = var.ai_vnet_id

  registration_enabled = false

  tags = var.tags
}

# ============================================================
# PRIVATE DNS - AZURE MACHINE LEARNING
# ============================================================

resource "azurerm_private_dns_zone" "aml_api" {
  name                = "privatelink.api.azureml.ms"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "aml_api" {
  name                  = "ai-aml-api-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.aml_api.name
  resource_group_name   = var.resource_group_name
  virtual_network_id    = var.ai_vnet_id

  registration_enabled = false

  tags = var.tags
}

resource "azurerm_private_dns_zone" "aml_notebooks" {
  name                = "privatelink.notebooks.azure.net"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "aml_notebooks" {
  name                  = "ai-aml-notebooks-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.aml_notebooks.name
  resource_group_name   = var.resource_group_name
  virtual_network_id    = var.ai_vnet_id

  registration_enabled = false

  tags = var.tags
}

# ============================================================
# PRIVATE DNS - STORAGE FILE
#
# Blob DNS is already managed by the existing
# ai_storage_private_dns module in the Landing Zone.
# ============================================================

resource "azurerm_private_dns_zone" "storage_file" {
  name                = "privatelink.file.core.windows.net"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage_file" {
  name                  = "ai-storage-file-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.storage_file.name
  resource_group_name   = var.resource_group_name
  virtual_network_id    = var.ai_vnet_id

  registration_enabled = false

  tags = var.tags
}

# ============================================================
# PRIVATE DNS - AZURE CONTAINER REGISTRY
# ============================================================

resource "azurerm_private_dns_zone" "acr" {
  name                = "privatelink.azurecr.io"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "acr" {
  name                  = "ai-acr-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.acr.name
  resource_group_name   = var.resource_group_name
  virtual_network_id    = var.ai_vnet_id

  registration_enabled = false

  tags = var.tags
}

# ============================================================
# KEY VAULT PRIVATE ENDPOINT
# ============================================================

resource "azurerm_private_endpoint" "key_vault" {
  name                = "pe-ai-keyvault"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_dns_zone_group {
    name                 = "keyvault-dns"
    private_dns_zone_ids = [azurerm_private_dns_zone.key_vault.id]
  }

  private_service_connection {
    name                           = "psc-ai-keyvault"
    private_connection_resource_id = azurerm_key_vault.this.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# ============================================================
# STORAGE FILE PRIVATE ENDPOINT
#
# Blob private endpoint is already managed by the existing
# AI Storage module.
# ============================================================

resource "azurerm_private_endpoint" "storage_file" {
  name                = "pe-ai-storage-file"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_dns_zone_group {
    name                 = "storage-file-dns"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage_file.id]
  }

  private_service_connection {
    name                           = "psc-ai-storage-file"
    private_connection_resource_id = var.storage_account_id
    subresource_names              = ["file"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# ============================================================
# ACR PRIVATE ENDPOINT
# ============================================================

resource "azurerm_private_endpoint" "acr" {
  name                = "pe-ai-acr"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_dns_zone_group {
    name                 = "acr-dns"
    private_dns_zone_ids = [azurerm_private_dns_zone.acr.id]
  }

  private_service_connection {
    name                           = "psc-ai-acr"
    private_connection_resource_id = azurerm_container_registry.this.id
    subresource_names              = ["registry"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# ============================================================
# AZURE MACHINE LEARNING WORKSPACE
# ============================================================

resource "azurerm_machine_learning_workspace" "this" {
  name                = var.workspace_name
  location            = var.location
  resource_group_name = var.resource_group_name

  application_insights_id = azurerm_application_insights.this.id
  key_vault_id            = azurerm_key_vault.this.id
  storage_account_id      = var.storage_account_id
  container_registry_id   = azurerm_container_registry.this.id

  public_network_access_enabled = false

  identity {
    type = "SystemAssigned"
  }

  depends_on = [
    azurerm_private_endpoint.key_vault,
    azurerm_private_endpoint.storage_file,
    azurerm_private_endpoint.acr
  ]

  tags = var.tags
}

# ============================================================
# AZURE ML WORKSPACE PRIVATE ENDPOINT
# ============================================================

resource "azurerm_private_endpoint" "aml_workspace" {
  name                = "pe-ai-ml-workspace"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_dns_zone_group {
    name = "aml-dns"

    private_dns_zone_ids = [
      azurerm_private_dns_zone.aml_api.id,
      azurerm_private_dns_zone.aml_notebooks.id
    ]
  }

  private_service_connection {
    name                           = "psc-ai-ml-workspace"
    private_connection_resource_id = azurerm_machine_learning_workspace.this.id
    subresource_names              = ["amlworkspace"]
    is_manual_connection           = false
  }

  tags = var.tags
}