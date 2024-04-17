# S3 resources for state management
import {
  to = aws_s3_bucket.tfstate_bucket
  id = var.tfstate_bucket_name
}

resource "aws_s3_bucket" "tfstate_bucket" {
  bucket = var.tfstate_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tfstate_bucket" {
  bucket = aws_s3_bucket.tfstate_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# DynamoDB Table for tofu state
resource "aws_dynamodb_table" "remotestate_table" {
  name         = var.tfstate_table_name
  hash_key     = "LockID"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "LockID"
    type = "S"
  }
}
