# This is the role under which ECS will execute our task.

# The assume_role_policy field works with the following aws_iam_policy_document to allow
# ECS tasks to assume this role we're creating.
resource "aws_iam_role" "apportionments_app_task_execution_role" {
  name               = "apportionments-app-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ecs_secrets" {
  statement {
    actions = [
      "secretsmanager:GetSecretValue",
      "kms:Decrypt",
    ]
    resources = [
      aws_rds_cluster.apportionments.master_user_secret[0].secret_arn,
    ]
  }
}

resource "aws_iam_policy" "ecs_secrets" {
  name        = "ecs-secrets"
  description = "A policy to give ECS access to Secrets Manager"
  policy      = data.aws_iam_policy_document.ecs_secrets.json
}

data "aws_iam_policy" "ecs_task_execution_role" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.apportionments_app_task_execution_role.name
  policy_arn = data.aws_iam_policy.ecs_task_execution_role.arn
}

resource "aws_iam_role_policy_attachment" "ecs_secrets" {
  role       = aws_iam_role.apportionments_app_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_secrets.arn
}
