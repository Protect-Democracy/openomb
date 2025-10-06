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
    name                   = aws_cloudfront_distribution.cf_dist.domain_name
    zone_id                = aws_cloudfront_distribution.cf_dist.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "apportionments_us_east_1" {
  for_each = {
    for dvo in aws_acm_certificate.cert_us_east_1.domain_validation_options : dvo.domain_name => {
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
    "forward-email=openomb@protectdemocracy.org"
  ]
}

# Mailgun Email Notification domain records

resource "aws_route53_record" "mailgun_sending" {
  for_each = {
    for record in data.mailgun_domain.domain.sending_records_set : record.id => record
  }
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = each.value.name
  type    = each.value.record_type
  ttl     = "600"
  records = [each.value.value]
}

resource "aws_route53_record" "mailgun_mx" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = data.mailgun_domain.domain.name
  type    = "MX"
  ttl     = "600"
  records = [
    for record in data.mailgun_domain.domain.receiving_records_set: "${record.priority} ${record.value}"
  ]
}

resource "aws_route53_record" "mailgun_dmarc" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = "_dmarc.${data.mailgun_domain.domain.name}"
  type    = "TXT"
  ttl     = "600"
  records = ["v=DMARC1;p=none;pct=0;rua=mailto:openomb@protectdemocracy.org"]
}
