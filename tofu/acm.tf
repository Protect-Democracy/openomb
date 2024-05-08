###########################
# Certificates
###########################

# Since Cloudfront needs a certificate in us-east-1, we need to create
# a certificate in the us-east-1 region.
resource "aws_acm_certificate" "cert_us_east_1" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  provider = aws.us_east
}

resource "aws_acm_certificate_validation" "cert_us_east_1" {
  certificate_arn         = aws_acm_certificate.cert_us_east_1.arn
  validation_record_fqdns = [for record in aws_route53_record.apportionments_us_east_1 : record.fqdn]
  provider                = aws.us_east
}

