---
name: tofu
description: Use when doing infrastructure work.
---

# Tofu skill

Note that tofu is an alternative to Terraform and generally configuration and values are the same.

Use this skill when doing infrastructure work, specifically the Terraform files in `tofu/`. This could include writing new Terraform code, maintaining existing Terraform code, and reviewing Terraform plans.

## Plan review

In order to review a tofu plan, do the following:

1. Review the changes to the tofu files in `tofu/` with `git main...` to see the changes since branching off main.
1. Ask the Developer for the AWS profile to use for the plan review.
1. Set env variable for AWS profile with `export AWS_PROFILE=<aws-profile-name>`.
1. Log into AWS with `aws sso login` if not already logged in.
1. Set env variable for tofu variables with `export TF_VAR_profile=<aws-profile-name>` .
1. Run plan: `cd tofu && tofu plan`
1. Summarize the changes, and assess whether they align with expected set of changes from the current context and changes from main.
