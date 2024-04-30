resource "aws_route53_zone" "apportionments" {
  name = "openomb.org"
}

resource "aws_route53_record" "alias_route53_record" {
  zone_id = aws_route53_zone.apportionments.zone_id
  name    = "openomb.org"
  type    = "A"

  alias {
    name                   = aws_alb.apportionments_app.dns_name
    zone_id                = aws_alb.apportionments_app.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "apportionments" {
  for_each = {
    for dvo in aws_acm_certificate.apportionments_app.domain_validation_options : dvo.domain_name => {
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
