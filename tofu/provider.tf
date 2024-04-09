provider "aws" {
  region  = "us-west-2"
  profile = "FullAdminApportionment"
}

terraform {
  required_version = ">= 1.2.0"

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
}
