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

resource "aws_iam_policy" "pass_role" {
  name        = "pass-role"
  description = "A policy to give ECS access to PassRole"
  policy      = data.aws_iam_policy_document.pass_role.json
}

data "aws_iam_policy_document" "pass_role" {
  statement {
    actions = [
      "iam:PassRole",
    ]
    resources = [
      "${aws_iam_role.apportionments_app_task_execution_role.arn}",
      "${aws_iam_role.db_migration.arn}",
      "${aws_iam_role.collect.arn}",
      "${aws_iam_role.notify.arn}"
    ]
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.apportionments_app_task_execution_role.name
  policy_arn = data.aws_iam_policy.ecs_task_execution_role.arn
}

resource "aws_iam_role_policy_attachment" "ecs_secrets" {
  role       = aws_iam_role.apportionments_app_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_secrets.arn
}

resource "aws_iam_role_policy_attachment" "pass_role" {
  role       = aws_iam_role.apportionments_app_task_execution_role.name
  policy_arn = aws_iam_policy.pass_role.arn
}

####################
# OpenID for GitHub
####################
variable "openid_thumbprint" {
  description = "OpenID thumbprint for AWS integration"
  type        = string
  default     = "1b511abead59c6ce207077c0bf0e0043b1382612"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [var.openid_thumbprint]
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.organization}/${var.repo_name}:*"]
    }
  }
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "github-actions-${var.organization}-${var.repo_name}"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

# Grants privileges needed to automate push to ECR and deployment to ECS for GitHub Actions
data "aws_iam_policy_document" "github_actions" {
  statement {
    actions = [
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [
      aws_ecr_repository.ecr.arn
    ]
  }

  statement {
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
    ]
    resources = ["*"]
  }

  statement {
    actions = [
      "iam:PassRole",
    ]
    resources = [
      "${aws_iam_role.apportionments_app_task_execution_role.arn}",
      "${aws_iam_role.db_migration.arn}",
      "${aws_iam_role.collect.arn}",
      "${aws_iam_role.notify.arn}",
    ]
  }

  statement {
    actions = [
      "ecs:UpdateService",
      "ecs:DescribeServices",
    ]
    resources = [
      "${aws_ecs_service.apportionments_app.id}"
    ]
  }

  statement {
    actions = [
      "s3:*"
    ]
    resources = [
      "${aws_s3_bucket.apportionments_logs.arn}",
      "${aws_s3_bucket.apportionments_logs.arn}/*"
    ]
  }

  statement {
    actions = ["s3:ListBucket"]
    resources = [
      "${aws_s3_bucket.tfstate_bucket.arn}",
      "${aws_s3_bucket.apportionments_bucket.arn}"
    ]
  }

  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.apportionments_bucket.arn}/*",
      "${aws_s3_bucket.tfstate_bucket.arn}/${var.tfstate_key_name}"
    ]
  }

  statement {
    actions = ["cloudfront:CreateInvalidation"]
    resources = [
      "${aws_cloudfront_distribution.cf_dist.arn}"
    ]
  }

}

resource "aws_iam_policy" "github_actions" {
  name        = "github-actions-${var.repo_name}"
  description = "Grant Github Actions the ability to push to ${var.repo_name}"
  policy      = data.aws_iam_policy_document.github_actions.json
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

###################
# GitHub Actions DB migration role
###################

resource "aws_iam_role" "db_migration" {
  name               = "db-migration"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

data "aws_iam_policy_document" "db_migration" {
  statement {
    actions = ["ecs:RunTask"]
    resources = [
      "${aws_ecs_task_definition.apportionments_migrate.arn_without_revision}:*"
    ]
  }

  statement {
    actions = ["s3:ListBucket"]
    resources = [
      "${aws_s3_bucket.tfstate_bucket.arn}",
      "${aws_s3_bucket.apportionments_bucket.arn}"
    ]
  }

  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      "${aws_s3_bucket.tfstate_bucket.arn}/${var.tfstate_key_name}",
      "${aws_s3_bucket.apportionments_bucket.arn}/*"
    ]
  }

  statement {
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
    resources = [
      "arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.remotestate_table.id}"
    ]
  }

  statement {
    actions = [
      "iam:PassRole",
    ]
    resources = [
      "${aws_iam_role.apportionments_app_task_execution_role.arn}",
      "${aws_iam_role.db_migration.arn}"
    ]
  }
}

resource "aws_iam_policy" "db_migration" {
  name        = "db-migration"
  description = "Grant the ability to run tasks on ECS"
  policy      = data.aws_iam_policy_document.db_migration.json
}

resource "aws_iam_role_policy_attachment" "db_migration" {
  role       = aws_iam_role.db_migration.name
  policy_arn = aws_iam_policy.db_migration.arn
}

resource "aws_iam_role_policy_attachment" "db_migration_gha" {
  role       = aws_iam_role.db_migration.name
  policy_arn = aws_iam_policy.github_actions.arn
}

resource "aws_iam_role_policy_attachment" "db_migration_assume_role" {
  role       = aws_iam_role.db_migration.name
  policy_arn = data.aws_iam_policy.ecs_task_execution_role.arn
}

###################
# GitHub Actions collect role
###################

resource "aws_iam_role" "collect" {
  name               = "collect"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

data "aws_iam_policy_document" "collect" {
  statement {
    actions = ["ecs:RunTask"]
    resources = [
      "${aws_ecs_task_definition.apportionments_collect.arn_without_revision}:*"
    ]
  }
  statement {
    actions = ["s3:ListBucket"]
    resources = [
      "${aws_s3_bucket.tfstate_bucket.arn}",
      "${aws_s3_bucket.apportionments_bucket.arn}"
    ]
  }

  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      "${aws_s3_bucket.tfstate_bucket.arn}/${var.tfstate_key_name}",
      "${aws_s3_bucket.apportionments_bucket.arn}/*"
    ]
  }

  statement {
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
    resources = [
      "arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.remotestate_table.id}"
    ]
  }

  statement {
    actions = [
      "iam:PassRole",
    ]
    resources = [
      "${aws_iam_role.apportionments_app_task_execution_role.arn}",
      "${aws_iam_role.collect.arn}"
    ]
  }
}

resource "aws_iam_policy" "collect" {
  name        = "collect"
  description = "Grant the ability to run tasks on ECS"
  policy      = data.aws_iam_policy_document.collect.json
}

resource "aws_iam_role_policy_attachment" "collect" {
  role       = aws_iam_role.collect.name
  policy_arn = aws_iam_policy.collect.arn
}

resource "aws_iam_role_policy_attachment" "collect_gha" {
  role       = aws_iam_role.collect.name
  policy_arn = aws_iam_policy.github_actions.arn
}

resource "aws_iam_role_policy_attachment" "collect_assume_role" {
  role       = aws_iam_role.collect.name
  policy_arn = data.aws_iam_policy.ecs_task_execution_role.arn
}

###################
# GitHub Actions notify role
###################

resource "aws_iam_role" "notify" {
  name               = "notify"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

data "aws_iam_policy_document" "notify" {
  statement {
    actions = ["ecs:RunTask"]
    resources = [
      "${aws_ecs_task_definition.apportionments_notify.arn_without_revision}:*"
    ]
  }
  statement {
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
    resources = [
      "arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.remotestate_table.id}"
    ]
  }

  statement {
    actions = [
      "iam:PassRole",
    ]
    resources = [
      "${aws_iam_role.apportionments_app_task_execution_role.arn}",
      "${aws_iam_role.notify.arn}"
    ]
  }
}

resource "aws_iam_policy" "notify" {
  name        = "notify"
  description = "Grant the ability to run tasks on ECS"
  policy      = data.aws_iam_policy_document.notify.json
}

resource "aws_iam_role_policy_attachment" "notify" {
  role       = aws_iam_role.notify.name
  policy_arn = aws_iam_policy.notify.arn
}

resource "aws_iam_role_policy_attachment" "notify_gha" {
  role       = aws_iam_role.notify.name
  policy_arn = aws_iam_policy.github_actions.arn
}

resource "aws_iam_role_policy_attachment" "notify_assume_role" {
  role       = aws_iam_role.notify.name
  policy_arn = data.aws_iam_policy.ecs_task_execution_role.arn
}

###################
# GitHub Actions update infrastructure role
###################

resource "aws_iam_role" "update_infrastructure" {
  name               = "update-infrastructure"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

resource "aws_iam_role_policy_attachment" "update_infrastructure_administrator_access" {
  role = aws_iam_role.update_infrastructure.name
  # Give this role Administrator level access because it will need to be
  # able to manipulate many aspects of infrastructure via tofu commands
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

###################
# AWS Backup Service role
###################

data "aws_iam_policy_document" "execute_backup" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "backup_service_role" {
  name               = "AWSBackupDefaultServiceRole"
  assume_role_policy = data.aws_iam_policy_document.execute_backup.json
}

# Attach the IAM policy required for backup operations
resource "aws_iam_role_policy_attachment" "backup_service_role_attachment" {
  role       = aws_iam_role.backup_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}
