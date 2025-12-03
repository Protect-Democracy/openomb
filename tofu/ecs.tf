resource "aws_ecs_cluster" "apportionments_app" {
  name = "apportionments-app"
}

resource "aws_ecs_service" "apportionments_app" {
  name            = "apportionments-app"
  task_definition = aws_ecs_task_definition.apportionments_app.arn
  cluster         = aws_ecs_cluster.apportionments_app.id
  launch_type     = "FARGATE"
  desired_count   = 1
  # This grace period can prevent the service scheduler from marking tasks as unhealthy and stopping them before they have time to come up.
  health_check_grace_period_seconds = 300

  network_configuration {
    assign_public_ip = false

    security_groups = [
      aws_security_group.egress_all.id,
      aws_security_group.ingress_app.id,
    ]

    subnets = [
      aws_subnet.private_a.id,
      aws_subnet.private_b.id,
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.apportionments_app.arn
    container_name   = "apportionments-app"
    container_port   = "3000"
  }
}

resource "aws_ecs_task_definition" "apportionments_app" {
  family = "apportionments-app"

  container_definitions = jsonencode([
    {
      "name" : "apportionments-app",
      "image" : "${aws_ecr_repository.ecr.repository_url}:latest",
      "essential" : true,
      "portMappings" : [
        {
          "containerPort" : 3000
        }
      ],
      "environment" : [
        {
          "name" : "APPORTIONMENTS_DB_HOST",
          "value" : "${aws_rds_cluster.apportionments.endpoint}"
        },
        {
          "name" : "APPORTIONMENTS_DB_PORT",
          "value" : "${tostring(aws_rds_cluster.apportionments.port)}"
        },
        {
          "name" : "APPORTIONMENTS_DB_NAME",
          "value" : "${aws_rds_cluster.apportionments.database_name}"
        },
        {
          "name" : "MAILGUN_DOMAIN",
          "value" : "mg.openomb.org"
        },
        {
          "name" : "MAILGUN_SEND_KEY",
          # "value" : "${mailgun_api_key.send_key.secret}"
          "value" : jsondecode(data.aws_secretsmanager_secret_version.mailgun_auth.secret_string)["SEND_KEY"]
        },
        {
          "name" : "AUTH_SECRET",
          "value" : jsondecode(data.aws_secretsmanager_secret_version.auth_secret.secret_string)["AUTH_SECRET"]
        },
        {
          "name" : "AUTH_URL", # Needed for authentication redirects to have correct (non-aws) domain
          "value" : "https://${var.domain_name}/auth"
        },
        {
          "name" : "ORIGIN", # Needed for authentication to work correctly
          "value" : "https://${var.domain_name}"
        },
        {
          "name" : "APPORTIONMENTS_SENTRY_SVELTE_REPORT_URI",
          "value" : jsondecode(data.aws_secretsmanager_secret_version.sentry_config.secret_string)["APPORTIONMENTS_SENTRY_SVELTE_REPORT_URI"]
        },
        {
          "name" : "PUBLIC_SENTRY_SVELTE_DSN",
          "value" : jsondecode(data.aws_secretsmanager_secret_version.sentry_config.secret_string)["PUBLIC_SENTRY_SVELTE_DSN"]
        },
        {
          "name" : "PUBLIC_NODE_ENV",
          "value" : "${var.node_env}"
        },
        {
          "name" : "NODE_ENV",
          "value" : "${var.node_env}"
        }
      ],
      "secrets" : [
        {
          "name" : "APPORTIONMENTS_DB_AUTHENTICATION",
          "valueFrom" : "${aws_rds_cluster.apportionments.master_user_secret[0].secret_arn}"
        }
      ],
      "logConfiguration" : {
        "logDriver" : "awslogs",
        "options" : {
          "awslogs-region" : "${var.region}",
          "awslogs-group" : "/ecs/apportionments-app",
          "awslogs-stream-prefix" : "ecs"
        }
      },
      # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters-managed-instances.html#container_definition_healthcheck-managed-instances
      "healthCheck" : {
        "command" : ["CMD-SHELL", "curl -f http://localhost:3000/api/v1/health || exit 1"],
        "interval" : 300,
        "startPeriod" : 30
      },
    }
  ])

  execution_role_arn = aws_iam_role.apportionments_app_task_execution_role.arn

  # Minimum values for Fargate
  cpu                      = 1024
  memory                   = 2048
  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"
}

resource "aws_ecs_task_definition" "apportionments_collect" {
  family = "apportionments-collect"

  container_definitions = jsonencode([
    {
      "name" : "apportionments-collect",
      "image" : "${aws_ecr_repository.ecr.repository_url}:latest",
      "essential" : true,
      "environment" : [
        {
          "name" : "APPORTIONMENTS_DB_HOST",
          "value" : "${aws_rds_cluster.apportionments.endpoint}"
        },
        {
          "name" : "APPORTIONMENTS_DB_PORT",
          "value" : "${tostring(aws_rds_cluster.apportionments.port)}"
        },
        {
          "name" : "APPORTIONMENTS_DB_NAME",
          "value" : "${aws_rds_cluster.apportionments.database_name}"
        },
        {
          "name" : "APPORTIONMENTS_ARCHIVE_S3_REGION",
          "value" : "${var.region}"
        },
        {
          "name" : "APPORTIONMENTS_ARCHIVE_S3_BUCKET",
          "value" : "${aws_s3_bucket.apportionments_bucket.id}"
        },
        {
          "name" : "APPORTIONMENTS_SENTRY_NODE_DSN",
          "value" : jsondecode(data.aws_secretsmanager_secret_version.sentry_config.secret_string)["APPORTIONMENTS_SENTRY_NODE_DSN"]
        },
        {
          "name" : "NODE_ENV",
          "value" : "${var.node_env}"
        },
        {
          "name" : "APPORTIONMENTS_AWS_CONTAINER_METADATA",
          "value" : "true"
        }
      ],
      "secrets" : [
        {
          "name" : "APPORTIONMENTS_DB_AUTHENTICATION",
          "valueFrom" : "${aws_rds_cluster.apportionments.master_user_secret[0].secret_arn}"
        }
      ],
      "command" : ["build-collect/collect.js"],
      "logConfiguration" : {
        "logDriver" : "awslogs",
        "options" : {
          "awslogs-region" : "${var.region}",
          "awslogs-group" : "/ecs/apportionments-collect",
          "awslogs-stream-prefix" : "ecs"
        }
      }
    }
  ])

  execution_role_arn = aws_iam_role.apportionments_app_task_execution_role.arn
  task_role_arn      = aws_iam_role.collect.arn

  # Minimum values for Fargate
  cpu                      = 1024
  memory                   = 2048
  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"
}

resource "aws_ecs_task_definition" "apportionments_migrate" {
  family = "apportionments-migrate"

  container_definitions = jsonencode([
    {
      "name" : "apportionments-migrate",
      "image" : "${aws_ecr_repository.ecr.repository_url}:latest",
      "essential" : true,
      "environment" : [
        {
          "name" : "APPORTIONMENTS_DB_HOST",
          "value" : "${aws_rds_cluster.apportionments.endpoint}"
        },
        {
          "name" : "APPORTIONMENTS_DB_PORT",
          "value" : "${tostring(aws_rds_cluster.apportionments.port)}"
        },
        {
          "name" : "APPORTIONMENTS_DB_NAME",
          "value" : "${aws_rds_cluster.apportionments.database_name}"
        },
        {
          "name" : "APPORTIONMENTS_SENTRY_NODE_DSN",
          "value" : jsondecode(data.aws_secretsmanager_secret_version.sentry_config.secret_string)["APPORTIONMENTS_SENTRY_NODE_DSN"]
        },
        {
          "name" : "NODE_ENV",
          "value" : "${var.node_env}"
        }
      ],
      "secrets" : [
        {
          "name" : "APPORTIONMENTS_DB_AUTHENTICATION",
          "valueFrom" : "${aws_rds_cluster.apportionments.master_user_secret[0].secret_arn}"
        }
      ],
      "command" : ["build-migrate/migrate.js"],
      "logConfiguration" : {
        "logDriver" : "awslogs",
        "options" : {
          "awslogs-region" : "${var.region}",
          "awslogs-group" : "/ecs/apportionments-migrate",
          "awslogs-stream-prefix" : "ecs"
        }
      }
    }
  ])

  execution_role_arn = aws_iam_role.apportionments_app_task_execution_role.arn
  task_role_arn      = aws_iam_role.db_migration.arn

  # Minimum values for Fargate
  cpu                      = 256
  memory                   = 512
  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"
}

resource "aws_ecs_task_definition" "apportionments_notify" {
  family = "apportionments-notify"

  container_definitions = jsonencode([
    {
      "name" : "apportionments-notify",
      "image" : "${aws_ecr_repository.ecr.repository_url}:latest",
      "essential" : true,
      "environment" : [
        {
          "name" : "APPORTIONMENTS_DB_HOST",
          "value" : "${aws_rds_cluster.apportionments.endpoint}"
        },
        {
          "name" : "APPORTIONMENTS_DB_PORT",
          "value" : "${tostring(aws_rds_cluster.apportionments.port)}"
        },
        {
          "name" : "APPORTIONMENTS_DB_NAME",
          "value" : "${aws_rds_cluster.apportionments.database_name}"
        },
        {
          "name" : "MAILGUN_DOMAIN",
          "value" : "mg.openomb.org"
        },
        {
          "name" : "MAILGUN_SEND_KEY",
          # "value" : "${mailgun_api_key.send_key.secret}"
          "value" : jsondecode(data.aws_secretsmanager_secret_version.mailgun_auth.secret_string)["SEND_KEY"]
        },
        {
          "name" : "APPORTIONMENTS_SENTRY_NODE_DSN",
          "value" : jsondecode(data.aws_secretsmanager_secret_version.sentry_config.secret_string)["APPORTIONMENTS_SENTRY_NODE_DSN"]
        },
        {
          "name" : "NODE_ENV",
          "value" : "${var.node_env}"
        }
      ],
      "secrets" : [
        {
          "name" : "APPORTIONMENTS_DB_AUTHENTICATION",
          "valueFrom" : "${aws_rds_cluster.apportionments.master_user_secret[0].secret_arn}"
        }
      ],
      "command" : ["build-notify/notify.js"],
      "logConfiguration" : {
        "logDriver" : "awslogs",
        "options" : {
          "awslogs-region" : "${var.region}",
          "awslogs-group" : "/ecs/apportionments-notify",
          "awslogs-stream-prefix" : "ecs"
        }
      }
    }
  ])

  execution_role_arn = aws_iam_role.apportionments_app_task_execution_role.arn
  task_role_arn      = aws_iam_role.notify.arn

  # Minimum values for Fargate
  cpu                      = 256
  memory                   = 512
  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"
}
