terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstateai4bb8b779"
    container_name       = "tfstate"
    key                  = "azure-development.tfstate"

    use_azuread_auth = true
    use_cli          = true
  }
}