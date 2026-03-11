###########################
# WAF v2 for CloudFront
###########################

# CloudFront WAF must be in us-east-1
resource "aws_wafv2_web_acl" "cloudfront" {
  name        = "apportionments-cloudfront-waf"
  description = "WAF for CloudFront: managed rules, geo-aware rate limiting"
  scope       = "CLOUDFRONT"
  provider    = aws.us_east

  default_action {
    allow {}
  }

  # Priority 0: Common attack protection (XSS, path traversal, etc.)
  rule {
    name     = "aws-common-rules"
    priority = 0

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        # Override to count to avoid SvelteKit false positives
        # with large form bodies (subscription management)
        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }

        # Override to count because SvelteKit server-side fetches
        # may omit User-Agent
        rule_action_override {
          name = "NoUserAgent_HEADER"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # Priority 1: SQL injection protection
  rule {
    name     = "aws-sqli-rules"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-sqli-rules"
      sampled_requests_enabled   = true
    }
  }

  # Priority 2: Bot control (common level)
  rule {
    name     = "aws-bot-control"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"

        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set {
            inspection_level = "COMMON"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-bot-control"
      sampled_requests_enabled   = true
    }
  }

  # Priority 3: Block non-US traffic above 500 req/5min
  rule {
    name     = "non-us-rate-limit-block"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 500
        aggregate_key_type = "IP"

        scope_down_statement {
          not_statement {
            statement {
              geo_match_statement {
                country_codes = ["US"]
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-non-us-rate-block"
      sampled_requests_enabled   = true
    }
  }

  # Priority 4: CAPTCHA non-US traffic above 100 req/5min
  rule {
    name     = "non-us-rate-limit-captcha"
    priority = 4

    action {
      captcha {}
    }

    statement {
      rate_based_statement {
        limit              = 100
        aggregate_key_type = "IP"

        scope_down_statement {
          not_statement {
            statement {
              geo_match_statement {
                country_codes = ["US"]
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-non-us-rate-captcha"
      sampled_requests_enabled   = true
    }
  }

  # Priority 5: Block US traffic above 2000 req/5min
  rule {
    name     = "us-rate-limit-block"
    priority = 5

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"

        scope_down_statement {
          geo_match_statement {
            country_codes = ["US"]
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-us-rate-block"
      sampled_requests_enabled   = true
    }
  }

  # CAPTCHA configuration
  captcha_config {
    immunity_time_property {
      immunity_time = 300
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "apportionments-cloudfront-waf"
    sampled_requests_enabled   = true
  }
}
