# AWS Landing Zone root module
#
# Resources will be added here through reusable modules.

module "transit_gateway" {
  source = "./modules/transit-gateway"

  name = "tgw-${lower(var.environment)}"

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}



module "general_vpc" {
  source = "./modules/vpc"

  vpc_name   = "vpc-general-${lower(var.environment)}"
  cidr_block = var.general_spoke_address_space

  subnets = {
    AppSubnet = {
      cidr_block        = "10.11.0.0/24"
      availability_zone = "ap-south-1a"
      type              = "Application"
    }

    DataSubnet = {
      cidr_block        = "10.11.1.0/24"
      availability_zone = "ap-south-1b"
      type              = "Data"
    }

    ManagementSubnet = {
      cidr_block        = "10.11.2.0/24"
      availability_zone = "ap-south-1a"
      type              = "Management"
    }

    TGWSubnetA = {
      cidr_block        = "10.11.10.0/28"
      availability_zone = "ap-south-1a"
      type              = "TransitGateway"
    }

    TGWSubnetB = {
      cidr_block        = "10.11.11.0/28"
      availability_zone = "ap-south-1b"
      type              = "TransitGateway"
    }
  }

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "General"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "general_tgw_attachment" {
  source = "./modules/tgw-attachment"

  name = "tgw-attachment-general-${lower(var.environment)}"

  transit_gateway_id = module.transit_gateway.transit_gateway_id

  vpc_id = module.general_vpc.vpc_id

  subnet_ids = [
    module.general_vpc.subnet_ids["TGWSubnetA"],
    module.general_vpc.subnet_ids["TGWSubnetB"]
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "General"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "ai_vpc" {
  source = "./modules/vpc"

  vpc_name   = "vpc-ai-${lower(var.environment)}"
  cidr_block = var.ai_spoke_address_space

  subnets = {
    AISubnet = {
      cidr_block        = "10.12.0.0/24"
      availability_zone = "ap-south-1a"
      type              = "AI"
    }

    PrivateEndpointSubnet = {
      cidr_block        = "10.12.1.0/24"
      availability_zone = "ap-south-1b"
      type              = "PrivateEndpoint"
    }

    ManagementSubnet = {
      cidr_block        = "10.12.2.0/24"
      availability_zone = "ap-south-1a"
      type              = "Management"
    }

    TGWSubnetA = {
      cidr_block        = "10.12.10.0/28"
      availability_zone = "ap-south-1a"
      type              = "TransitGateway"
    }

    TGWSubnetB = {
      cidr_block        = "10.12.11.0/28"
      availability_zone = "ap-south-1b"
      type              = "TransitGateway"
    }
  }

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "ai_tgw_attachment" {
  source = "./modules/tgw-attachment"

  name = "tgw-attachment-ai-${lower(var.environment)}"

  transit_gateway_id = module.transit_gateway.transit_gateway_id

  vpc_id = module.ai_vpc.vpc_id

  subnet_ids = [
    module.ai_vpc.subnet_ids["TGWSubnetA"],
    module.ai_vpc.subnet_ids["TGWSubnetB"]
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "general_route_table" {
  source = "./modules/route-table"

  name = "rt-general-${lower(var.environment)}"

  vpc_id = module.general_vpc.vpc_id

  transit_gateway_id = module.transit_gateway.transit_gateway_id

  destination_cidr = "10.12.0.0/16"

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "General"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "ai_route_table" {
  source = "./modules/route-table"

  name = "rt-ai-${lower(var.environment)}"

  vpc_id = module.ai_vpc.vpc_id

  transit_gateway_id = module.transit_gateway.transit_gateway_id

  destination_cidr = "10.11.0.0/16"

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "AI"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "general_app_sg" {
  source = "./modules/security-group"

  name        = "general-app-${lower(var.environment)}"
  description = "Security group for General application workloads"
  vpc_id      = module.general_vpc.vpc_id

  ingress_rules = [
    {
      description = "HTTPS from General VPC"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["10.11.0.0/16"]
    }
  ]

  egress_rules = [
    {
      description = "HTTPS outbound"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "General"
    Component    = "Application"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "general_data_sg" {
  source = "./modules/security-group"

  name        = "general-data-${lower(var.environment)}"
  description = "Security group for General data workloads"
  vpc_id      = module.general_vpc.vpc_id

  ingress_rules = [
    {
      description = "HTTPS from General application subnet"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["10.11.0.0/24"]
    }
  ]

  egress_rules = [
    {
      description = "HTTPS outbound"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "General"
    Component    = "Data"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "ai_workload_sg" {
  source = "./modules/security-group"

  name        = "ai-workload-${lower(var.environment)}"
  description = "Security group for AI workloads"
  vpc_id      = module.ai_vpc.vpc_id

  ingress_rules = [
    {
      description = "HTTPS from AI VPC"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["10.12.0.0/16"]
    }
  ]

  egress_rules = [
    {
      description = "HTTPS outbound"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "AI"
    Component    = "AI Workload"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}

module "management_sg" {
  source = "./modules/security-group"

  name        = "management-${lower(var.environment)}"
  description = "Security group for management workloads"
  vpc_id      = module.general_vpc.vpc_id

  ingress_rules = [
    {
      description = "HTTPS management access"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["10.11.0.0/16"]
    }
  ]

  egress_rules = [
    {
      description = "HTTPS outbound"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "Management"
    Component    = "Management"
    Architecture = "Spoke"
    ManagedBy    = "Terraform"
  }
}
module "inspection_vpc" {
  source = "./modules/vpc"

  vpc_name   = "vpc-inspection-${lower(var.environment)}"
  cidr_block = "10.10.0.0/16"

  subnets = {
    FirewallSubnetA = {
      cidr_block        = "10.10.0.0/24"
      availability_zone = "ap-south-1a"
      type              = "Firewall"
    }

    FirewallSubnetB = {
      cidr_block        = "10.10.1.0/24"
      availability_zone = "ap-south-1b"
      type              = "Firewall"
    }

    TGWSubnetA = {
      cidr_block        = "10.10.10.0/28"
      availability_zone = "ap-south-1a"
      type              = "TransitGateway"
    }

    TGWSubnetB = {
      cidr_block        = "10.10.11.0/28"
      availability_zone = "ap-south-1b"
      type              = "TransitGateway"
    }
  }

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "Inspection"
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}

module "inspection_tgw_attachment" {
  source = "./modules/tgw-attachment"

  name = "tgw-attachment-inspection-${lower(var.environment)}"

  transit_gateway_id = module.transit_gateway.transit_gateway_id

  vpc_id = module.inspection_vpc.vpc_id

  subnet_ids = [
    module.inspection_vpc.subnet_ids["TGWSubnetA"],
    module.inspection_vpc.subnet_ids["TGWSubnetB"]
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "Inspection"
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}

module "network_firewall" {
  source = "./modules/network-firewall"

  name = "inspection-firewall-${lower(var.environment)}"

  vpc_id = module.inspection_vpc.vpc_id

  firewall_subnet_ids = [
    module.inspection_vpc.subnet_ids["FirewallSubnetA"],
    module.inspection_vpc.subnet_ids["FirewallSubnetB"]
  ]

  tags = {
    Platform     = var.platform_name
    Environment  = var.environment
    Workload     = "Inspection"
    Architecture = "Hub"
    ManagedBy    = "Terraform"
  }
}

resource "aws_route_table_association" "general_app" {
  subnet_id      = module.general_vpc.subnet_ids["AppSubnet"]
  route_table_id = module.general_route_table.route_table_id
}

resource "aws_route_table_association" "general_data" {
  subnet_id      = module.general_vpc.subnet_ids["DataSubnet"]
  route_table_id = module.general_route_table.route_table_id
}

resource "aws_route_table_association" "general_management" {
  subnet_id      = module.general_vpc.subnet_ids["ManagementSubnet"]
  route_table_id = module.general_route_table.route_table_id
}

resource "aws_route_table_association" "ai" {
  subnet_id      = module.ai_vpc.subnet_ids["AISubnet"]
  route_table_id = module.ai_route_table.route_table_id
}

resource "aws_route_table_association" "ai_management" {
  subnet_id      = module.ai_vpc.subnet_ids["ManagementSubnet"]
  route_table_id = module.ai_route_table.route_table_id
}

resource "aws_ec2_transit_gateway_route" "general_to_ai" {
  destination_cidr_block         = "10.12.0.0/16"
  transit_gateway_route_table_id = module.transit_gateway.route_table_id
  transit_gateway_attachment_id  = module.ai_tgw_attachment.attachment_id
}

resource "aws_ec2_transit_gateway_route" "ai_to_general" {
  destination_cidr_block         = "10.11.0.0/16"
  transit_gateway_route_table_id = module.transit_gateway.route_table_id
  transit_gateway_attachment_id  = module.general_tgw_attachment.attachment_id
}

