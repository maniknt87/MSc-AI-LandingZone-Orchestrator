terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}
locals {
  name_prefix = lower(var.deployment_name)
  common_tags = {
    LandingZone = var.deployment_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    ModelId     = var.model_id
    ModelName   = var.model_name
  }
}
# --------------------------------------------------
# This is a demo configuration.
# No cloud resources are created yet.
# --------------------------------------------------
resource "azurerm_resource_group" "connectivity" {
  name     = "rg-${local.name_prefix}-connectivity-${lower(var.environment)}"
  location = var.region

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}

resource "azurerm_resource_group" "general" {
  name     = "rg-${local.name_prefix}-general-${lower(var.environment)}"
  location = var.region

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "General"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

resource "azurerm_resource_group" "ai" {
  name     = "rg-${local.name_prefix}-ai-${lower(var.environment)}"
  location = var.region

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "hub" {
  source = "./modules/hub"

  resource_group_name = azurerm_resource_group.connectivity.name
  location            = azurerm_resource_group.connectivity.location
  vnet_name           = "vnet-${local.name_prefix}-hub-${lower(var.environment)}"
  address_space       = [var.hub_address_space]
}

module "general_spoke" {
  source = "./modules/spoke"

  resource_group_name = azurerm_resource_group.general.name
  location            = azurerm_resource_group.general.location

  vnet_name     = "vnet-spoke-general-${lower(var.environment)}"
  address_space = [var.general_spoke_address_space]

  hub_vnet_id = module.hub.vnet_id

  subnets = {
    AppSubnet = {
      address_prefix = cidrsubnet(var.general_spoke_address_space, 8, 0)
    }

    DataSubnet = {
      address_prefix = cidrsubnet(var.general_spoke_address_space, 8, 1)
    }

    ManagementSubnet = {
      address_prefix = cidrsubnet(var.general_spoke_address_space, 8, 2)
    }
  }
}

module "ai_spoke" {
  source = "./modules/spoke"

  resource_group_name = azurerm_resource_group.ai.name
  location            = azurerm_resource_group.ai.location

  vnet_name     = "vnet-spoke-ai-${lower(var.environment)}"
  address_space = [var.ai_spoke_address_space]

  hub_vnet_id = module.hub.vnet_id

  subnets = {
    AISubnet = {
      address_prefix = cidrsubnet(var.ai_spoke_address_space, 8, 0)
    }

    PrivateEndpointSubnet = {
      address_prefix = cidrsubnet(var.ai_spoke_address_space, 8, 1)
    }

    ManagementSubnet = {
      address_prefix = cidrsubnet(var.ai_spoke_address_space, 8, 2)
    }
  }
}

module "general_app_nsg" {
  source = "./modules/nsg"

  resource_group_name = azurerm_resource_group.general.name
  location            = azurerm_resource_group.general.location

  nsg_name = "nsg-general-app-${lower(var.environment)}"

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "General"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }

  rules = {
    https_from_hub = {
      priority                   = 100
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "443"
      source_address_prefix      = var.hub_address_space
      destination_address_prefix = "*"
    }
  }
}

module "general_data_nsg" {
  source = "./modules/nsg"

  resource_group_name = azurerm_resource_group.general.name
  location            = azurerm_resource_group.general.location

  nsg_name = "nsg-general-data-${lower(var.environment)}"

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "General"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }

  rules = {
    sql_from_app = {
      priority                   = 100
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "1433"
      source_address_prefix      = cidrsubnet(var.general_spoke_address_space, 8, 0)
      destination_address_prefix = "*"
    }
  }
}

module "ai_nsg" {
  source = "./modules/nsg"

  resource_group_name = azurerm_resource_group.ai.name
  location            = azurerm_resource_group.ai.location

  nsg_name = "nsg-ai-${lower(var.environment)}"

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
  rules = {
    https_from_hub = {
      priority                   = 100
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "443"
      source_address_prefix      = var.hub_address_space
      destination_address_prefix = "*"
    }
  }
}

module "hub_firewall" {
  source = "./modules/firewall"

  resource_group_name = azurerm_resource_group.connectivity.name
  location            = azurerm_resource_group.connectivity.location

  firewall_name = "afw-${lower(var.environment)}"

  subnet_id = module.hub.firewall_subnet_id

  firewall_policy_id = module.hub_firewall_policy.policy_id

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}

module "hub_firewall_policy" {
  source = "./modules/firewall-policy"

  resource_group_name = azurerm_resource_group.connectivity.name
  location            = azurerm_resource_group.connectivity.location

  policy_name = "afwp-${lower(var.environment)}"

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}

module "general_route_table" {
  source = "./modules/route-table"

  resource_group_name = azurerm_resource_group.general.name
  location            = azurerm_resource_group.general.location

  route_table_name = "rt-general-${lower(var.environment)}"

  firewall_private_ip = module.hub_firewall.private_ip_address

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "General"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}


module "ai_route_table" {
  source = "./modules/route-table"

  resource_group_name = azurerm_resource_group.ai.name
  location            = azurerm_resource_group.ai.location

  route_table_name = "rt-ai-${lower(var.environment)}"

  firewall_private_ip = module.hub_firewall.private_ip_address

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "ai_storage_private_dns" {
  source = "./modules/private-dns"

  resource_group_name = azurerm_resource_group.connectivity.name

  zone_name = "privatelink.blob.core.windows.net"

  vnet_id = module.ai_spoke.vnet_id

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Hub-Spoke"
    ManagedBy    = "Terraform"
  }
}

module "ai_storage" {
  source = "./modules/storage"

  resource_group_name = azurerm_resource_group.ai.name
  location            = azurerm_resource_group.ai.location

  storage_account_name = "aigov${lower(var.environment)}${substr(replace(data.azurerm_client_config.current.subscription_id, "-", ""), 0, 8)}"

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "ai_storage_private_endpoint" {
  source = "./modules/private-endpoint"

  resource_group_name = azurerm_resource_group.ai.name
  location            = azurerm_resource_group.ai.location

  private_endpoint_name = "pe-ai-storage-${lower(var.environment)}"

  subnet_id = module.ai_spoke.subnet_ids["PrivateEndpointSubnet"]

  private_connection_resource_id = module.ai_storage.storage_account_id

  subresource_names = ["blob"]

  private_dns_zone_id = module.ai_storage_private_dns.zone_id

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "central_monitoring" {
  source = "./modules/monitoring"

  resource_group_name = azurerm_resource_group.connectivity.name
  location            = azurerm_resource_group.connectivity.location

  workspace_name = "law-${lower(var.environment)}"

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}


module "ai_ml" {
  source = "./modules/ai-ml"

  resource_group_name = azurerm_resource_group.ai.name
  location            = azurerm_resource_group.ai.location

  workspace_name = "aml-${lower(var.environment)}"

  storage_account_id = module.ai_storage.storage_account_id

  key_vault_name            = "kvai${lower(var.environment)}${substr(replace(data.azurerm_client_config.current.subscription_id, "-", ""), 0, 8)}a"
  application_insights_name = "appi-ai-${lower(var.environment)}"

  private_endpoint_subnet_id = module.ai_spoke.subnet_ids["PrivateEndpointSubnet"]

  ai_vnet_id = module.ai_spoke.vnet_id

  log_analytics_workspace_id = module.central_monitoring.workspace_id

  acr_name = "acrai${lower(var.environment)}4bb8b779"

  tags = {
    Platform     = "Multi-Cloud Governance & Landing Zone Orchestration Platform"
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

resource "azurerm_subnet_network_security_group_association" "general_app" {
  subnet_id                 = module.general_spoke.subnet_ids["AppSubnet"]
  network_security_group_id = module.general_app_nsg.nsg_id
}

resource "azurerm_subnet_network_security_group_association" "general_data" {
  subnet_id                 = module.general_spoke.subnet_ids["DataSubnet"]
  network_security_group_id = module.general_data_nsg.nsg_id
}

resource "azurerm_subnet_network_security_group_association" "ai" {
  subnet_id                 = module.ai_spoke.subnet_ids["AISubnet"]
  network_security_group_id = module.ai_nsg.nsg_id
}

resource "azurerm_virtual_network_peering" "hub_to_ai" {
  name                      = "hub-to-ai-${lower(var.environment)}"
  resource_group_name       = azurerm_resource_group.connectivity.name
  virtual_network_name      = module.hub.vnet_name
  remote_virtual_network_id = module.ai_spoke.vnet_id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

resource "azurerm_virtual_network_peering" "hub_to_general" {
  name                      = "hub-to-general-${lower(var.environment)}"
  resource_group_name       = azurerm_resource_group.connectivity.name
  virtual_network_name      = module.hub.vnet_name
  remote_virtual_network_id = module.general_spoke.vnet_id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

resource "azurerm_subnet_route_table_association" "general_app" {
  subnet_id      = module.general_spoke.subnet_ids["AppSubnet"]
  route_table_id = module.general_route_table.route_table_id
}

resource "azurerm_subnet_route_table_association" "general_data" {
  subnet_id      = module.general_spoke.subnet_ids["DataSubnet"]
  route_table_id = module.general_route_table.route_table_id
}

resource "azurerm_subnet_route_table_association" "general_management" {
  subnet_id      = module.general_spoke.subnet_ids["ManagementSubnet"]
  route_table_id = module.general_route_table.route_table_id
}

resource "azurerm_subnet_route_table_association" "ai" {
  subnet_id      = module.ai_spoke.subnet_ids["AISubnet"]
  route_table_id = module.ai_route_table.route_table_id
}

resource "azurerm_subnet_route_table_association" "ai_management" {
  subnet_id      = module.ai_spoke.subnet_ids["ManagementSubnet"]
  route_table_id = module.ai_route_table.route_table_id
}

resource "azurerm_monitor_diagnostic_setting" "firewall" {
  name                       = "diag-firewall-${lower(var.environment)}"
  target_resource_id         = module.hub_firewall.firewall_id
  log_analytics_workspace_id = module.central_monitoring.workspace_id

  enabled_log {
    category = "AzureFirewallApplicationRule"
  }

  enabled_log {
    category = "AzureFirewallNetworkRule"
  }

  enabled_log {
    category = "AzureFirewallDnsProxy"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

resource "azurerm_monitor_diagnostic_setting" "hub_vnet" {
  name                       = "diag-hub-vnet-${lower(var.environment)}"
  target_resource_id         = module.hub.vnet_id
  log_analytics_workspace_id = module.central_monitoring.workspace_id

  enabled_metric {
    category = "AllMetrics"
  }
}

locals {
  platform_name = "Multi-Cloud Governance & Landing Zone Orchestration Platform"

  version = "1.0"

  deployment_status = "Ready"
}

output "platform_name" {
  value = local.platform_name
}

output "version" {
  value = local.version
}

output "deployment_status" {
  value = local.deployment_status
}
output "connectivity_resource_group_name" {
  value = azurerm_resource_group.connectivity.name
}

output "general_resource_group_name" {
  value = azurerm_resource_group.general.name
}

output "ai_resource_group_name" {
  value = azurerm_resource_group.ai.name
}
