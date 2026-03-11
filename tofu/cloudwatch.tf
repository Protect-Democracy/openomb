####################
# Log groups
####################

resource "aws_cloudwatch_log_group" "apportionments_app" {
  name = "/ecs/apportionments-app"
}
resource "aws_cloudwatch_log_group" "apportionments_collect" {
  name = "/ecs/apportionments-collect"
}
resource "aws_cloudwatch_log_group" "apportionments_migrate" {
  name = "/ecs/apportionments-migrate"
}

resource "aws_cloudwatch_log_group" "apportionments_notify" {
  name = "/ecs/apportionments-notify"
}

####################
# Dashboard
####################

resource "aws_cloudwatch_dashboard" "apportionments" {
  dashboard_name = "apportionments-overview"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: ECS metrics
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "## ECS — apportionments-app"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 1
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["ECS/ContainerInsights", "CpuUtilized", "ClusterName", aws_ecs_cluster.apportionments_app.name, "ServiceName", aws_ecs_service.apportionments_app.name],
            ["ECS/ContainerInsights", "CpuReserved", "ClusterName", aws_ecs_cluster.apportionments_app.name, "ServiceName", aws_ecs_service.apportionments_app.name]
          ]
          title  = "CPU (Utilized vs Reserved)"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 1
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["ECS/ContainerInsights", "MemoryUtilized", "ClusterName", aws_ecs_cluster.apportionments_app.name, "ServiceName", aws_ecs_service.apportionments_app.name],
            ["ECS/ContainerInsights", "MemoryReserved", "ClusterName", aws_ecs_cluster.apportionments_app.name, "ServiceName", aws_ecs_service.apportionments_app.name]
          ]
          title  = "Memory (Utilized vs Reserved)"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 1
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["ECS/ContainerInsights", "RunningTaskCount", "ClusterName", aws_ecs_cluster.apportionments_app.name, "ServiceName", aws_ecs_service.apportionments_app.name]
          ]
          title  = "Running Task Count"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },

      # Row 2: RDS metrics
      {
        type   = "text"
        x      = 0
        y      = 7
        width  = 24
        height = 1
        properties = {
          markdown = "## RDS — Aurora PostgreSQL Serverless v2"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 8
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", aws_rds_cluster.apportionments.cluster_identifier]
          ]
          title  = "Serverless Capacity (ACU)"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 8
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", aws_rds_cluster.apportionments.cluster_identifier]
          ]
          title  = "CPU Utilization (%)"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 8
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", aws_rds_cluster.apportionments.cluster_identifier]
          ]
          title  = "Database Connections"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },

      # Row 3: RDS latency and memory
      {
        type   = "metric"
        x      = 0
        y      = 14
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", "DBClusterIdentifier", aws_rds_cluster.apportionments.cluster_identifier],
            ["AWS/RDS", "WriteLatency", "DBClusterIdentifier", aws_rds_cluster.apportionments.cluster_identifier]
          ]
          title  = "Read / Write Latency (seconds)"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 14
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "FreeableMemory", "DBClusterIdentifier", aws_rds_cluster.apportionments.cluster_identifier]
          ]
          title  = "Freeable Memory (bytes)"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 14
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ACUUtilization", "DBClusterIdentifier", aws_rds_cluster.apportionments.cluster_identifier]
          ]
          title  = "ACU Utilization (%)"
          region = var.region
          stat   = "Average"
          period = 300
          view   = "timeSeries"
        }
      }
    ]
  })
}
