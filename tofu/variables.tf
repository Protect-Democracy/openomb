variable "region" {
  default     = "us-west-2"
  description = "Default region for AWS services"
  type        = string
}

variable "profile" {
  description = "AWS profile name"
  type        = string
}

variable "tfstate_table_name" {
  default     = "tfstate-lock"
  description = "DynamoDB table name for tf state lock"
  type        = string
}

variable "tfstate_bucket_name" {
  default     = "pd-apportionments-tfstate"
  description = "S3 bucket for project state file"
  type        = string
}

variable "tfstate_key_name" {
  default     = "terraform.tfstate"
  description = "Key name for terraform state"
  type        = string
}

variable "apportionments_repo" {
  description = "Apportionments repository name"
  type        = string
  default     = "apportionments-repo"
}

#variable "vpc_cidr" {
#  type        = string
#  description = "CIDR block for the main VPC"
#}
#
#variable "public_subnet_a" {
#  type        = string
#  description = "CIDR block for public subnet 1"
#}
#
#variable "public_subnet_b" {
#  type        = string
#  description = "CIDR block for public subnet 2"
#}
#
#variable "private_subnet_a" {
#  type        = string
#  description = "CIDR block for private subnet 1"
#}
#
#variable "private_subnet_b" {
#  type        = string
#  description = "CIDR block for private subnet 2"
#}

#variable "availability_zone_1" {
#  type        = string
#  description = "First availibility zone"
#}

#variable "availability_zone_2" {
#  type        = string
#  description = "First availibility zone"
#}

#variable "container_port" {
#  description = "Port that needs to be exposed for the application"
#}
#
#variable "shared_config_files" {
#  description = "Path of your shared config file in .aws folder"
#}
#
#variable "shared_credentials_files" {
#  description = "Path of your shared credentials file in .aws folder"
#}
#
#variable "credential_profile" {
#  description = "Profile name in your credentials file"
#  type        = string
#}
#
