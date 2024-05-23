# Apportionments infrastructure

## Requirements

The Apportionments infrastructure uses [OpenTofu](https://opentofu.org), an open source alternative to Terraform.

- [OpenTofu](https://opentofu.org/docs/intro/install/) v1.7.0+
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) v2
- A valid AWS profile with proper permissions for updating infrastructure

## Setup

The following is a simple guide to get you started with OpenTofu and the Apportionments project infrastructure.

1. Navigate to the `tofu` directory in the Apportionments project.
2. Log in to the AWS CLI using your profile, e.g. `aws sso login --profile my-apportionments-profile`
3. Set your `AWS_PROFILE` in your shell, e.g. `export AWS_PROFILE=my-apportionments-profile`
4. Set your profile for OpenTofu as well using the `TF_VAR_profile` environment variable, e.g. `export TF_VAR_profile=my-apportionments-profile`
5. Initialize OpenTofu in from the tofu folder: `tofu init`

After running these commands, you should be ready to use OpenTofu regularly. Note, you will need to update your SSO login periodically as the credentials expire after a short time (several hours).

## Usage

OpenTofu is a drop-in replacement for Terraform. Use of Terraform modules should be supported, but when running commands, use the `tofu` command in place of `terraform`.

When making changes to infrastructure files, this project does not currently support automated application of those changes. _You must apply the changes manually from the command line._

Common commands are:

- `tofu fmt` - Automatically format tofu files, e.g. correct white space, etc.
- `tofu validate` – Ensure the syntax of the tofu files is correct before planning or applying.
- `tofu plan` – Create an execution plan from the existing infrastructure and any new changes that are pending.
- `tofu apply` – Apply the pending changes to the infrastructure. _This will result in changes to resources on AWS._

## State management

Infrastructure managed by OpenTofu is maintained through a state file. As configured for this project, this includes state locking to prevent multiple changes from affecting the state simultaneously. The state file is stored in a bucket on AWS S3. See the [state_mgmt.tf](https://github.com/Protect-Democracy/apportionments/blob/main/tofu/state_mgmt.tf) file for more details about this configuration.

### Unlocking a lock

Sometimes a state lock will get stuck. OpenTofu provides a [force-unlock](https://opentofu.org/docs/v1.6/cli/commands/force-unlock/) command to deal with this condition.
