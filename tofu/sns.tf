resource "aws_sns_topic" "ecs_task_failures" {
  name = "ecs-task-failures"
}

resource "aws_sns_topic_policy" "ecs_task_failures" {
  arn    = aws_sns_topic.ecs_task_failures.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    effect  = "Allow"
    actions = ["SNS:Publish"]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    resources = [aws_sns_topic.ecs_task_failures.arn]
  }
}
