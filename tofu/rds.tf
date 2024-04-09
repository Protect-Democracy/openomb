# NOTE This project uses [OpenTofu](https://opentofu.org) instead of terraform
# See also [tenv](https://github.com/tofuutils/tenv) for managing OpenTofu environments

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

#resource "aws_vpc_endpoint" "rds_endpoint" {
#  vpc_id            = aws_vpc.apportionments_vpc.id
#  service_name      = "com.amazonaws.us-west-2.rds_cluster"
#  vpc_endpoint_type = "Gateway"
#  route_table_ids   = [aws_route_table.private.id]
#  policy = jsonencode({
#    "Version" : "2012-10-17",
#    "Statement" : [
#      {
#        "Effect" : "Allow",
#        "Principal" : "*",
#        "Action" : "*",
#        "Resource" : "*"
#      }
#    ]
#  })
#}
