resource "aws_ecr_repository" "ecr" {
  name                 = var.apportionments_repo
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = true
  }
}

output "ecr_repo" {
  value = aws_ecr_repository.ecr.repository_url
}

#The ECR policy describes the management of images in the repo
resource "aws_ecr_lifecycle_policy" "ecr_policy" {
  repository = aws_ecr_repository.ecr.name
  policy     = local.ecr_policy
}

#This is the policy defining the rules for images in the repo
locals {
  ecr_policy = jsonencode({
    "rules" : [
      {
        "rulePriority" : 1,
        "description" : "Expire images older than 7 days",
        "selection" : {
          "tagStatus" : "any",
          "countType" : "sinceImagePushed",
          "countUnit" : "days",
          "countNumber" : 7
        },
        "action" : {
          "type" : "expire"
        }
      }
    ]
  })
}

#The commands below are used to build and push a docker image of the application in the app folder
locals {
  docker_login_command = "aws ecr get-login-password --region ${var.region} --profile ${var.profile}| docker login --username AWS --password-stdin ${local.account_id}.dkr.ecr.${var.region}.amazonaws.com"
  # TODO: REMOVE buildx if it's not needed
  #docker_build_command = "docker buildx build --platform linux/amd64,linux/arm64 -t ${aws_ecr_repository.ecr.name} .."
  docker_build_command = "docker build -t ${aws_ecr_repository.ecr.name} .."
  docker_tag_command   = "docker tag ${aws_ecr_repository.ecr.name}:latest ${local.account_id}.dkr.ecr.${var.region}.amazonaws.com/${aws_ecr_repository.ecr.name}:latest"
  docker_push_command  = "docker push ${local.account_id}.dkr.ecr.${var.region}.amazonaws.com/${aws_ecr_repository.ecr.name}:latest"
}

#This resource authenticates you to the ECR service
resource "null_resource" "docker_login" {
  provisioner "local-exec" {
    command = local.docker_login_command
  }
  triggers = {
    "run_at" = timestamp()
  }
  depends_on = [aws_ecr_repository.ecr]
}

#This resource builds the docker image from the Dockerfile in the app folder
resource "null_resource" "docker_build" {
  provisioner "local-exec" {
    command = local.docker_build_command
  }
  triggers = {
    "run_at" = timestamp()
  }
  depends_on = [null_resource.docker_login]
}

#This resource tags the image 
resource "null_resource" "docker_tag" {
  provisioner "local-exec" {
    command = local.docker_tag_command
  }
  triggers = {
    "run_at" = timestamp()
  }
  depends_on = [null_resource.docker_build]
}

#This resource pushes the docker image to the ECR repo
resource "null_resource" "docker_push" {
  provisioner "local-exec" {
    command = local.docker_push_command
  }
  triggers = {
    "run_at" = timestamp()
  }
  depends_on = [null_resource.docker_tag]
}
