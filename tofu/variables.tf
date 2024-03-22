variable "region" {
  default     = "us-west-2"
  description = "Default region for AWS services"
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
