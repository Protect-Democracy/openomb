# Domain identity

resource "aws_ses_domain_identity" "domain_identity" {
  domain = var.domain_name
}

resource "aws_ses_domain_mail_from" "domain_mail_from" {
  domain           = aws_ses_domain_identity.domain_identity.domain
  mail_from_domain = "mail.${var.domain_name}"
}

# Address identity

resource "aws_ses_email_identity" "notifier" {
  email = "notifier@${var.domain_name}"
}

resource "aws_ses_domain_mail_from" "notifier_mail_from" {
  domain           = aws_ses_email_identity.notifier.email
  mail_from_domain = "mail.${var.domain_name}"
}

# dkim identity -  DomainKeys Identified Mail

resource "aws_ses_domain_dkim" "dkim_identity" {
  domain = aws_ses_domain_identity.domain_identity.domain
}

# domain_identity_verification

resource "aws_ses_domain_identity_verification" "domain_identity_verification" {
  domain = aws_ses_domain_identity.domain_identity.id

  depends_on = [aws_route53_record.amazonses_dkim_records]
}

# configuration set
resource "aws_ses_configuration_set" "notification_emails" {
  name = "notification-emails"
}
