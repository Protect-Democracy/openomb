# RDS Aurora Serverless v2 PostgreSQL
# Adapted from https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/rds_cluster
resource "aws_rds_cluster" "apportionments" {
  cluster_identifier                  = "apportionments-cluster"
  engine                              = "aurora-postgresql"
  engine_mode                         = "provisioned"
  engine_version                      = "13.13"
  database_name                       = "apportionments_db"
  final_snapshot_identifier           = "apportionments-final"
  iam_database_authentication_enabled = true
  manage_master_user_password         = true
  master_username                     = "pd_admin"
  storage_encrypted                   = true

  serverlessv2_scaling_configuration {
    max_capacity = 8.0
    min_capacity = 0.5
  }
}

resource "aws_rds_cluster_instance" "apportionments" {
  cluster_identifier = aws_rds_cluster.apportionments.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.apportionments.engine
  engine_version     = aws_rds_cluster.apportionments.engine_version
}

# S3
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

resource "aws_s3_bucket" "apportionments_bucket" {
  bucket              = "pd-apportionments"
  object_lock_enabled = false
}

resource "aws_s3_bucket_versioning" "apportionments_bucket" {
  bucket = aws_s3_bucket.apportionments_bucket.id
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
