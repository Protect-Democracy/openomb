data "aws_secretsmanager_secret" "sentry_config" {
  arn = "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:sentry_config"
}

data "aws_secretsmanager_secret_version" "sentry_config" {
  secret_id = data.aws_secretsmanager_secret.sentry_config.id
}

data "aws_secretsmanager_secret" "auth_secret" {
  arn = "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:auth_secret"
}

data "aws_secretsmanager_secret_version" "auth_secret" {
  secret_id = data.aws_secretsmanager_secret.auth_secret.id
}
