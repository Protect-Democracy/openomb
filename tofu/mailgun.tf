data "mailgun_domain" "domain" {
  name = "mg.${var.domain_name}"
}

# Coming!! - https://github.com/wgebis/terraform-provider-mailgun/pull/64
#resource "mailgun_api_key" "send_key" {
#  role = "sending"
#  kind = "domain"
#  domain_name = data.mailgun_domain.domain.name
#  description = "Sending key for OpenOMB Notifications"
#}
