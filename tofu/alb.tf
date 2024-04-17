resource "aws_lb_target_group" "apportionments_app" {
  name        = "apportionments-app"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.app_vpc.id

  health_check {
    enabled = true
    path    = "/api/v1/health"
  }

  depends_on = [aws_alb.apportionments_app]
}

resource "aws_alb" "apportionments_app" {
  name               = "apportionments-app-lb"
  internal           = false
  load_balancer_type = "application"

  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id,
  ]

  security_groups = [
    aws_security_group.http.id,
    aws_security_group.https.id,
    aws_security_group.egress_all.id,
  ]

  depends_on = [aws_internet_gateway.igw]
}

# TODO: Use these commented sections once domain is settled. See below.
#resource "aws_acm_certificate" "apportionments_app" {
#  domain_name       = "apportionmentsforcats.com"
#  validation_method = "DNS"
#}

#output "domain_validations" {
#  value = aws_acm_certificate.apportionments_app.domain_validation_options
#}

#resource "aws_alb_listener" "apportionments_app_https" {
#  load_balancer_arn = aws_alb.apportionments_app.arn
#  port = "443"
#  protocol = "HTTPS"
#  certificate_arn = aws_acm_certificate.apportionments_app.arn
#
#  default_action {
#    type = "forward"
#    target_group_arn = aws_lb_target_group.apportionments_app.arn
#  }
#}

#resource "aws_alb_listener" "apportionments_app_http" {
#  load_balancer_arn = aws_alb.apportionments_app.arn
#  port              = "80"
#  protocol          = "HTTP"
#
#  default_action {
#    type = "redirect"
#
#    redirect {
#      port        = "443"
#      protocol    = "HTTPS"
#      status_code = "HTTP_301"
#    }
#  }
#}

# TODO: Change over the HTTPS versions above once domain is in place
# For details, see: https://section411.com/2019/07/hello-world/
resource "aws_alb_listener" "apportionments_app_http" {
  load_balancer_arn = aws_alb.apportionments_app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.apportionments_app.arn
  }
}

output "alb_url" {
  value = "http://${aws_alb.apportionments_app.dns_name}"
}
