resource "aws_security_group" "http" {
  name        = "http"
  description = "HTTP traffic"
  vpc_id      = aws_vpc.app_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "TCP"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    "Project" = "apportionments"
  }
}

resource "aws_security_group" "https" {
  name        = "https"
  description = "HTTPS traffic"
  vpc_id      = aws_vpc.app_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "TCP"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    "Project" = "apportionments"
  }
}

resource "aws_security_group" "egress_all" {
  name        = "egress-all"
  description = "Allow all outbound traffic"
  vpc_id      = aws_vpc.app_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    "Project" = "apportionments"
  }
}

resource "aws_security_group" "ingress_app" {
  name        = "ingress-app"
  description = "Allow ingress to web app"
  vpc_id      = aws_vpc.app_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "TCP"
    #cidr_blocks = [var.private_a_cidr_block, var.private_b_cidr_block]
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    "Project" = "apportionments"
  }
}

# Security group rule for accessing the Aurora RDS database
# Allows access on port 5432 for traffic coming from the private subnet blocks
resource "aws_security_group" "database" {
  name        = "database"
  description = "Allow ingress to database"
  vpc_id      = aws_vpc.app_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "TCP"
    cidr_blocks = [var.private_a_cidr_block, var.private_b_cidr_block]
  }

  tags = {
    "Project" = "apportionments"
  }
}
