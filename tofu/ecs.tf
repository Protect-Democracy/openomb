resource "aws_ecs_cluster" "apportionments_app" {
  name = "apportionments-app"
}

resource "aws_ecs_service" "apportionments_app" {
  name                 = "apportionments-app"
  task_definition      = aws_ecs_task_definition.apportionments_app.arn
  cluster              = aws_ecs_cluster.apportionments_app.id
  launch_type          = "FARGATE"
  desired_count        = 1
  force_new_deployment = true

  network_configuration {
    assign_public_ip = false

    security_groups = [
      aws_security_group.egress_all.id,
      aws_security_group.ingress_api.id,
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
  cpu                      = 256
  memory                   = 512
  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"
}

