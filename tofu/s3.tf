# S3
resource "aws_s3_bucket" "apportionments_bucket" {
  bucket              = "pd-apportionments"
  object_lock_enabled = false
}

resource "aws_s3_bucket_versioning" "apportionments_bucket" {
  bucket = aws_s3_bucket.apportionments_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "apportionments_bucket" {
  bucket = aws_s3_bucket.apportionments_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
