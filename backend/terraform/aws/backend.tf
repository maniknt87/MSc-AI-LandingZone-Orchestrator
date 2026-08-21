terraform {
  backend "s3" {
    bucket  = "mani-terraform-state-699754982224"
    key     = "aws/terraform.tfstate"
    region  = "ap-south-1"
    encrypt = true
  }
}