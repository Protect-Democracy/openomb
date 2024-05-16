resource "aws_ecs_cluster" "apportionments_app" {
  name = "apportionments-app"
}

resource "aws_ecs_service" "apportionments_app" {
  name            = "apportionments-app"
  task_definition = aws_ecs_task_definition.apportionments_app.arn
  cluster         = aws_ecs_cluster.apportionments_app.id
  launch_type     = "FARGATE"
  desired_count   = 1

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
      "image" : "${aws_ecr_repository.ecr.repository_url}:latest"
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
      }
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
      "image" : "${aws_ecr_repository.ecr.repository_url}:latest"
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
          "name" : "APPORTIONMENTS_AWS_SSO",
          "value" : "true"
        },
        {
          "name" : "APPORTIONMENTS_AWS_SSO_START_URL",
          "value" : "${var.sso_start_url}"
        },
        {
          "name" : "APPORTIONMENTS_AWS_SSO_ACCOUNT_ID",
          "value" : "${data.aws_caller_identity.current.account_id}"
        },
        {
          "name" : "APPORTIONMENTS_AWS_SSO_ROLE_NAME",
          "value" : "${aws_iam_role.collect.name}"
        },
        {
          "name" : "APPORTIONMENTS_AWS_SSO_REGION",
          "value" : "${var.region}"
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
      "image" : "${aws_ecr_repository.ecr.repository_url}:latest"
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
