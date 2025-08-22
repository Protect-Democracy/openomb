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

resource "aws_cloudwatch_log_group" "notifications_service" {
  name = "/ecs/notifications-service"
}

resource "aws_cloudwatch_log_group" "notifications_queue" {
  name = "/ecs/notifications-queue"
}

resource "aws_cloudwatch_log_group" "notifications_queue_worker" {
  name = "/ecs/notifications-queue-worker"
}
resource "aws_cloudwatch_log_group" "apportionments_export_footnotes" {
  name = "/ecs/apportionments-export-footnotes"
}
