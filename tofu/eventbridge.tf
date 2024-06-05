resource "aws_cloudwatch_event_rule" "ecs_task_failures" {
  name        = "ecs-task-failure"
  description = "ECS Task failure"

  event_pattern = jsonencode({
    source = [
      "aws.ecs"
    ]
    detail-type = [
      "ECS Task State Change"
    ]
    detail = {
      lastStatus = [
        "STOPPED"
      ]
      containers = {
        exitCode = [
          {
            "anything-but" : 0
          }
        ]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.ecs_task_failures.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.ecs_task_failures.arn
}
