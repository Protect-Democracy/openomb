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
    "forward-email=openomb@protectdemocracy.org",
  ]
}

# SES Email Notification domain records

resource "aws_route53_record" "amazonses_dkim_records" {
  count   = 3
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = "${element(aws_ses_domain_dkim.dkim_identity.dkim_tokens, count.index)}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = "600"
  records = ["${element(aws_ses_domain_dkim.dkim_identity.dkim_tokens, count.index)}.dkim.amazonses.com"]
}

resource "aws_route53_record" "amazonses_mail_from_mx" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = aws_ses_domain_mail_from.main.mail_from_domain
  type    = "MX"
  ttl     = "600"
  records = ["10 feedback-smtp.${var.region}.amazonses.com"] # Change to the region in which aws_ses_domain_identity is created
}

resource "aws_route53_record" "spf_domain" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com -all"]
}

resource "aws_route53_record" "spf_mail_from" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = aws_ses_domain_mail_from.main.mail_from_domain
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com -all"]
}
