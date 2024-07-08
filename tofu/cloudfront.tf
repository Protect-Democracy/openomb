###########################
# Cloudfront
###########################

# Following resource was useful in setting up Cloudfront with ALB
# Ref: https://hands-on.cloud/cloudfront-terraform-examples/#h-integrating-cloudfront-with-alb-using-terraform
resource "aws_cloudfront_distribution" "cf_dist" {
  enabled = true
  aliases = [var.domain_name]

  origin {
    domain_name = aws_alb.apportionments_app.dns_name
    origin_id   = aws_alb.apportionments_app.dns_name
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = aws_alb.apportionments_app.dns_name
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = aws_cloudfront_cache_policy.apportionments.id
    compress               = true
  }

  logging_config {
    bucket          = "${var.cloudfront_logs_bucket_name}.s3.amazonaws.com"
    include_cookies = false
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert_us_east_1.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2018"
  }
}

resource "aws_cloudfront_cache_policy" "apportionments" {
  name    = "apportionments-policy"
  comment = "Use cache for all requests, forward all query strings"
  min_ttl = 1

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "all"
    }
  }
}
