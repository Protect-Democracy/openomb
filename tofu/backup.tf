# AWS Backup service – Used for scheduled backups of RDS and could
# be expanded to other services as well.
#
# Details on this particular implementation were developed from
# https://faun.pub/how-to-safeguard-your-rds-instances-with-terraform-backup-plans-acdc3349ee2a

resource "aws_backup_vault" "vault" {
  name        = "openomb-backup-vault"
  kms_key_arn = aws_kms_key.vault_key.arn
}

resource "aws_kms_key" "vault_key" {
  description         = "KMS key for Backup Vault encryption"
  enable_key_rotation = true
}

# Create a backup plan for the RDS instance
resource "aws_backup_plan" "rds_instance_backup_plan" {
  name = "rds-instance-backup-plan"

  # Weekly backup retained for 60 days
  rule {
    rule_name         = "rds-instance-weekly-backup-rule"
    target_vault_name = aws_backup_vault.vault.name
    schedule          = "cron(0 1 ? * FRI *)"

    lifecycle {
      delete_after = 60
    }
  }

  # Monthly backup retained for 180 days
  rule {
    rule_name         = "rds-instance-monthly-backup-rule"
    target_vault_name = aws_backup_vault.vault.name
    schedule          = "cron(0 7 1 * ? *)"

    lifecycle {
      delete_after = 180
    }
  }
}

# Create a backup selection, which links the plan to the resource (in this case RDS)
resource "aws_backup_selection" "rds_instance_selection" {
  iam_role_arn = aws_iam_role.backup_service_role.arn
  name         = "rds-instance-backup-selection"
  plan_id      = aws_backup_plan.rds_instance_backup_plan.id

  resources = [
    aws_rds_cluster.apportionments.arn
  ]
}
