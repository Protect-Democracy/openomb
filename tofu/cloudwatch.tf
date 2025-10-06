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
