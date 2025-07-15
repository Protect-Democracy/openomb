# NOTE This project uses [OpenTofu](https://opentofu.org) instead of terraform
# See also [tenv](https://github.com/tofuutils/tenv) for managing OpenTofu environments

# RDS Aurora Serverless v2 PostgreSQL
# Adapted from https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/rds_cluster

# Defines the major version of Aurora postgresql in use
variable "engine_version" {
  description = "Aurora RDS engine version"
  type        = number
  default     = 16
}

# Defines the number of days to retain backups
# (Set to 1 because we are using AWS Backup Service for long term snapshots)
variable "backup_retention_period" {
  description = "Length in days to retain database backups"
  type        = number
  default     = 1
}

# Defines the master username for the Aurora postgresql database
variable "master_username" {
  description = "Username for the master user"
  type        = string
  default     = "pd_admin"
}

# Creates a random extension each time an apply is triggered
# This is used to name the final snapshot in a unique way each time an apply is run
resource "random_pet" "apportionments" {
  length = 16
}

# Subnet group required to define which subnets can access the database
resource "aws_db_subnet_group" "apportionments" {
  name       = "apportionments"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

####################
# Database
####################
resource "aws_rds_cluster" "apportionments" {
  cluster_identifier                  = "apportionments-cluster"
  engine                              = "aurora-postgresql"
  engine_mode                         = "provisioned"
  engine_version                      = var.engine_version
  database_name                       = "apportionments_db"
  final_snapshot_identifier           = "apportionments-final-${random_pet.apportionments.id}"
  iam_database_authentication_enabled = false
  manage_master_user_password         = true
  master_username                     = var.master_username
  storage_encrypted                   = true
  backup_retention_period             = var.backup_retention_period
  apply_immediately                   = true

  serverlessv2_scaling_configuration {
    max_capacity = 8.0
    min_capacity = 0.5
  }

  db_subnet_group_name            = aws_db_subnet_group.apportionments.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.apportionments.name
  vpc_security_group_ids          = [aws_security_group.egress_all.id, aws_security_group.database.id]
}

resource "aws_rds_cluster_instance" "apportionments" {
  cluster_identifier           = aws_rds_cluster.apportionments.id
  instance_class               = "db.serverless"
  engine                       = aws_rds_cluster.apportionments.engine
  engine_version               = aws_rds_cluster.apportionments.engine_version
  db_subnet_group_name         = aws_db_subnet_group.apportionments.name
  performance_insights_enabled = true
  apply_immediately            = true
}

# These parameter group settings allow us to configure various options
# without having to recreate the database
resource "aws_rds_cluster_parameter_group" "apportionments" {
  name   = "apportionments"
  family = "aurora-postgresql${var.engine_version}"

  parameter {
    name  = "log_connections"
    value = "1"
  }
}
