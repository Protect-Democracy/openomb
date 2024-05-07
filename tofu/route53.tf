###########################
# Route 53
###########################

resource "aws_route53_zone" "apportionments" {
  name = var.domain_name
}

resource "aws_route53_record" "alias_route53_record" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = aws_route53_zone.apportionments.name
  type    = "A"

  alias {
    name                   = aws_alb.apportionments_app.dns_name
    zone_id                = aws_alb.apportionments_app.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "apportionments" {
  for_each = {
    for dvo in aws_acm_certificate.cert_us_west_2.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.apportionments.zone_id
}

# Setup for forwarding support email to Google Group
# Using service forwardemail.net for easy setup
resource "aws_route53_record" "email_mx" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = ""
  type    = "MX"
  ttl     = 3600

  records = [
    "10 mx1.forwardemail.net",
    "10 mx2.forwardemail.net",
  ]
}

resource "aws_route53_record" "email_txt" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = ""
  type    = "TXT"
  ttl     = 3600

  records = [
    "forward-email=openomb@protectdemocracy.org",
  ]
}
