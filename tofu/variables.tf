######################
# Variable definitions
######################

variable "region" {
  default     = "us-west-2"
  description = "Default region for AWS services"
  type        = string
}

variable "profile" {
  description = "AWS profile name"
  type        = string
}

variable "domain_name" {
  description = "Website domain name"
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

variable "node_env" {
  description = "Node environment to use with ECS tasks"
  type        = string
  default     = "production"
}

####################
# GitHub integration
####################

variable "repo_name" {
  description = "Name of the ECR Repository"
  type        = string
}

variable "organization" {
  description = "Name of the Github Organization."
  type        = string
  default     = "Protect-Democracy"
}
