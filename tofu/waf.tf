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

  # Priority 0: Block common scanner/recon paths before they reach the origin.
  # To add new patterns, add a regular_expression block to the
  # aws_wafv2_regex_pattern_set.recon_paths resource below — no rule changes needed.
  rule {
    name     = "block-recon-paths"
    priority = 0

    action {
      block {}
    }

    statement {
      regex_pattern_set_reference_statement {
        arn = aws_wafv2_regex_pattern_set.recon_paths.arn

        field_to_match {
          uri_path {}
        }

        # Decode then lowercase so encoded variants (%2e%2e, %2F, etc.) are caught
        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }

        text_transformation {
          priority = 1
          type     = "LOWERCASE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-recon-paths-block"
      sampled_requests_enabled   = true
    }
  }

  # Priority 1: Known bad inputs — Log4j RCE, SSRF, exploitable paths, Java
  # deserialization, Windows shell injection. AWS maintains this rule set.
  rule {
    name     = "aws-known-bad-inputs"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # Priority 2: Common attack protection (XSS, path traversal, etc.)
  rule {
    name     = "aws-common-rules"
    priority = 2

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

  # Priority 3: SQL injection protection
  rule {
    name     = "aws-sqli-rules"
    priority = 3

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

  # Priority 4: Known malicious IP reputation (bot infrastructure, DDoS sources, etc.)
  rule {
    name     = "aws-ip-reputation"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apportionments-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  # Priority 5: Bot control (targeted level detects headless browsers and JS-capable bots)
  rule {
    name     = "aws-bot-control"
    priority = 5

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"

        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set {
            inspection_level = "TARGETED"
          }
        }

        # Exclude Sentry's uptime monitoring bot from bot control inspection
        scope_down_statement {
          not_statement {
            statement {
              byte_match_statement {
                search_string         = "SentryUptimeBot"
                positional_constraint = "CONTAINS"

                field_to_match {
                  single_header {
                    name = "user-agent"
                  }
                }

                text_transformation {
                  priority = 0
                  type     = "NONE"
                }
              }
            }
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

  # Priority 6: Block non-US traffic above 150 req/5min
  rule {
    name     = "non-us-rate-limit-block"
    priority = 6

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 150
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

  # Priority 7: CAPTCHA non-US traffic above 100 req/5min
  rule {
    name     = "non-us-rate-limit-captcha"
    priority = 7

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

  # Priority 8: Block US traffic above 1000 req/5min
  rule {
    name     = "us-rate-limit-block"
    priority = 8

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
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

###########################
# Recon path pattern set
###########################

# URI paths commonly probed by automated scanners. Add a regular_expression block
# here when a new recon vector appears in logs — the block-recon-paths rule above
# picks it up automatically on the next tofu apply.
resource "aws_wafv2_regex_pattern_set" "recon_paths" {
  name        = "apportionments-recon-paths"
  description = "URI paths commonly targeted by automated scanners and attackers"
  scope       = "CLOUDFRONT"
  provider    = aws.us_east

  # Dotfiles — secrets and VCS metadata (.env, .env.old, .git/, .htaccess, etc.)
  regular_expression { regex_string = "/\\.(env|git|htaccess|htpasswd|ssh|aws)" }

  # IP/metadata disclosure endpoints
  regular_expression { regex_string = "(^/ip$|/latest/meta-data)" }

  # WordPress / common CMS fingerprinting
  regular_expression { regex_string = "/(wp-admin|wp-login\\.php|wp-includes|xmlrpc\\.php|phpmyadmin)" }

  # Config and credential files
  regular_expression { regex_string = "/config\\.(php|yml|yaml|json|ini|xml)" }
  regular_expression { regex_string = "/(database\\.yml|credentials)" }

  # Framework / runtime fingerprinting
  regular_expression { regex_string = "/(actuator|cgi-bin)/" }

  # Web shells
  regular_expression { regex_string = "/(shell|cmd|eval-stdin)\\.php" }

  tags = {}
}
