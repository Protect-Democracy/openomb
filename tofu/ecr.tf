resource "aws_ecr_repository" "ecr" {
  name                 = "openomb"
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
        "description" : "Expire any additional images",
        "selection" : {
          "tagStatus" : "any",
          "countType" : "imageCountMoreThan",
          "countNumber" : 3
        },
        "action" : {
          "type" : "expire"
        }
      }
    ]
  })
}

# ECR for Notifications queue
resource "aws_ecr_repository" "notifications" {
  name                 = "notifications"
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "ecr_notifications_policy" {
  repository = aws_ecr_repository.notifications.name
  policy     = local.ecr_policy
}

output "ecr_notifications_repo" {
  value = aws_ecr_repository.notifications.repository_url
}
