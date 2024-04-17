# Networking
# This looks like a lot, but it is required by terraform to set up other resources
# VPC – A custom VPC for placing all application resources
# Subnets – two public and two private subnets for various uses
# Route tables – two route tables, one for the public network, one for the private
# NAT – Addressing for private network
# IGW – Internet gateway for public network
# Routes – For both private and public networks
# Security groups – Define the port-based access control for the network. See specific rules below.

variable "public_a_cidr_block" {
  description = "CIDR block for us-west-2a public subnet"
  type        = string
  default     = "10.0.1.0/25"
}

variable "public_b_cidr_block" {
  description = "CIDR block for us-west-2b public subnet"
  type        = string
  default     = "10.0.1.128/25"
}

variable "private_a_cidr_block" {
  description = "CIDR block for us-west-2a private subnet"
  type        = string
  default     = "10.0.2.0/25"
}

variable "private_b_cidr_block" {
  description = "CIDR block for us-west-2b private subnet"
  type        = string
  default     = "10.0.2.128/25"
}

resource "aws_vpc" "app_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = var.public_a_cidr_block
  availability_zone = "us-west-2a"

  tags = {
    "Name" = "public | us-west-2a"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = var.private_a_cidr_block
  availability_zone = "us-west-2a"

  tags = {
    "Name" = "private | us-west-2a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = var.public_b_cidr_block
  availability_zone = "us-west-2b"

  tags = {
    "Name" = "public | us-west-2b"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = var.private_b_cidr_block
  availability_zone = "us-west-2b"

  tags = {
    "Name" = "private | us-west-2b"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.app_vpc.id
  tags = {
    "Name" = "public"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.app_vpc.id
  tags = {
    "Name" = "private"
  }
}

resource "aws_route_table_association" "public_a_subnet" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_a_subnet" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "public_b_subnet" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_b_subnet" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app_vpc.id
}

resource "aws_nat_gateway" "ngw" {
  subnet_id     = aws_subnet.public_a.id
  allocation_id = aws_eip.nat.id

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route" "public_igw" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route" "private_ngw" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.ngw.id
}

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
}

# TODO: Remove when implementing application
resource "aws_security_group" "ingress_api" {
  name        = "ingress-api"
  description = "Allow ingress to API"
  vpc_id      = aws_vpc.app_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "TCP"
    cidr_blocks = ["0.0.0.0/0"]
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
}
