###########################
# Provider
###########################

provider "aws" {
  region = "us-west-2"
}

# NOTE: This alternate provider is needed because Cloudfront requires us-east-1
provider "aws" {
  alias  = "us_east"
  region = "us-east-1"
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
      source = "hashicorp/aws"
    }
  }
}
