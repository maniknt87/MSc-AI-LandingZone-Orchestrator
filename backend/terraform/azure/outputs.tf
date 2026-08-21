output "deployment_summary" {

  value = {

    cloud = var.cloud

    environment = var.environment

    region = var.region

    workload = var.workload

    deployment_name = var.deployment_name

    hub_address_space = var.hub_address_space

    general_spoke_address_space = var.general_spoke_address_space

    ai_spoke_address_space = var.ai_spoke_address_space

  }

}
