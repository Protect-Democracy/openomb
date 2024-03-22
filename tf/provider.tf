# Terraform Remote State to S3
# Ref: https://developer.hashicorp.com/terraform/language/settings/backends/s3
terraform {
  backend "s3" {
    bucket         = "pd-apportionments-tfstate"
    dynamodb_table = "tfstate-lock"
    encrypt        = true
    key            = "tofu.tfstate"
    region         = "us-west-2"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-west-2"
}
