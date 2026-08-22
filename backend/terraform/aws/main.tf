# AWS Landing Zone root module
#
# Resources will be added here through reusable modules.

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "sagemaker_execution" {
  name = "sm-${lower(var.deployment_name)}-${lower(var.environment)}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sagemaker.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Platform    = var.platform_name
    Environment = var.environment
    Workload    = var.workload
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "sagemaker_execution" {
  name = "sagemaker-inference-runtime"
  role = aws_iam_role.sagemaker_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PullInferenceImage"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Sid    = "WriteInferenceLogsAndMetrics"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Sid    = "ReadApprovedModelArtifacts"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "arn:aws:s3:::ai-model-artifacts-${data.aws_caller_identity.current.account_id}-${var.aws_region}/models/*"
      }
    ]
  })
}

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
      cidr_block        = cidrsubnet(var.general_spoke_address_space, 8, 0)
      availability_zone = "${var.aws_region}a"
      type              = "Application"
    }

    DataSubnet = {
      cidr_block        = cidrsubnet(var.general_spoke_address_space, 8, 1)
      availability_zone = "${var.aws_region}b"
      type              = "Data"
    }

    ManagementSubnet = {
      cidr_block        = cidrsubnet(var.general_spoke_address_space, 8, 2)
      availability_zone = "${var.aws_region}a"
      type              = "Management"
    }

    TGWSubnetA = {
      cidr_block        = cidrsubnet(var.general_spoke_address_space, 12, 160)
      availability_zone = "${var.aws_region}a"
      type              = "TransitGateway"
    }

    TGWSubnetB = {
      cidr_block        = cidrsubnet(var.general_spoke_address_space, 12, 161)
      availability_zone = "${var.aws_region}b"
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
      cidr_block        = cidrsubnet(var.ai_spoke_address_space, 8, 0)
      availability_zone = "${var.aws_region}a"
      type              = "AI"
    }

    PrivateEndpointSubnet = {
      cidr_block        = cidrsubnet(var.ai_spoke_address_space, 8, 1)
      availability_zone = "${var.aws_region}b"
      type              = "PrivateEndpoint"
    }

    ManagementSubnet = {
      cidr_block        = cidrsubnet(var.ai_spoke_address_space, 8, 2)
      availability_zone = "${var.aws_region}a"
      type              = "Management"
    }

    TGWSubnetA = {
      cidr_block        = cidrsubnet(var.ai_spoke_address_space, 12, 160)
      availability_zone = "${var.aws_region}a"
      type              = "TransitGateway"
    }

    TGWSubnetB = {
      cidr_block        = cidrsubnet(var.ai_spoke_address_space, 12, 161)
      availability_zone = "${var.aws_region}b"
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

  destination_cidr = var.ai_spoke_address_space

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

  destination_cidr = var.general_spoke_address_space

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
      cidr_blocks = [var.general_spoke_address_space]
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
      cidr_blocks = [cidrsubnet(var.general_spoke_address_space, 8, 0)]
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
      cidr_blocks = [var.ai_spoke_address_space]
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
      cidr_blocks = [var.general_spoke_address_space]
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
      availability_zone = "${var.aws_region}a"
      type              = "Firewall"
    }

    FirewallSubnetB = {
      cidr_block        = "10.10.1.0/24"
      availability_zone = "${var.aws_region}b"
      type              = "Firewall"
    }

    TGWSubnetA = {
      cidr_block        = "10.10.10.0/28"
      availability_zone = "${var.aws_region}a"
      type              = "TransitGateway"
    }

    TGWSubnetB = {
      cidr_block        = "10.10.11.0/28"
      availability_zone = "${var.aws_region}b"
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
  destination_cidr_block         = var.ai_spoke_address_space
  transit_gateway_route_table_id = module.transit_gateway.route_table_id
  transit_gateway_attachment_id  = module.ai_tgw_attachment.attachment_id
}

resource "aws_ec2_transit_gateway_route" "ai_to_general" {
  destination_cidr_block         = var.general_spoke_address_space
  transit_gateway_route_table_id = module.transit_gateway.route_table_id
  transit_gateway_attachment_id  = module.general_tgw_attachment.attachment_id
}

