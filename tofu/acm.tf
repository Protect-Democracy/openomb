###########################
# Certificates
###########################

# We define a separate certificate for the us-west-2 region
# because that's where the load balancer lives
# We have a us-east-1 certificate because cloudfront is yolo region only
resource "aws_acm_certificate" "cert_us_west_2" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "apportionments_app" {
  certificate_arn         = aws_acm_certificate.cert_us_west_2.arn
  validation_record_fqdns = [for record in aws_route53_record.apportionments : record.fqdn]
}

# Since Cloudfront needs a certificate in us-east-1, we need to create
# a second certificate just for it. :P
resource "aws_acm_certificate" "cert_us_east_1" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  provider = aws.us_east
}
