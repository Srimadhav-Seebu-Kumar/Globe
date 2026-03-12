# AWS Hosting Automation

This repository deploys three services to AWS App Runner:
- `globe-api`
- `globe-web`
- `globe-admin`

Container builds are published to ECR and deployments are triggered via GitHub Actions.

## Prerequisites

1. AWS account access with permissions to manage:
   - ECR
   - IAM
   - App Runner
2. GitHub repository admin access.
3. AWS CLI configured locally (or run commands in AWS CloudShell).

## One-time bootstrap

Run:

```powershell
./infra/aws/scripts/bootstrap.ps1 -AwsRegion us-east-1 -GithubRepo "Srimadhav-Seebu-Kumar/Globe"
```

This script creates:
- ECR repositories: `globe-api`, `globe-web`, `globe-admin`
- App Runner ECR access role
- GitHub OIDC deploy role

## App Runner services

After initial image push, create services:

```bash
aws apprunner create-service \
  --service-name globe-api \
  --source-configuration '{"ImageRepository":{"ImageIdentifier":"<account>.dkr.ecr.<region>.amazonaws.com/globe-api:latest","ImageRepositoryType":"ECR","ImageConfiguration":{"Port":"4000","RuntimeEnvironmentVariables":{"APP_OPERATOR_EMAIL":"operator@example.com","APP_OPERATOR_PASSWORD":"<set-secret>","APP_ALLOWED_ORIGINS":"https://<web-url>,https://<admin-url>"}}},"AuthenticationConfiguration":{"AccessRoleArn":"<app-runner-ecr-access-role-arn>"},"AutoDeploymentsEnabled":false}'

aws apprunner create-service \
  --service-name globe-web \
  --source-configuration '{"ImageRepository":{"ImageIdentifier":"<account>.dkr.ecr.<region>.amazonaws.com/globe-web:latest","ImageRepositoryType":"ECR","ImageConfiguration":{"Port":"3000","RuntimeEnvironmentVariables":{"NEXT_PUBLIC_API_BASE_URL":"https://<api-url>"}}},"AuthenticationConfiguration":{"AccessRoleArn":"<app-runner-ecr-access-role-arn>"},"AutoDeploymentsEnabled":false}'

aws apprunner create-service \
  --service-name globe-admin \
  --source-configuration '{"ImageRepository":{"ImageIdentifier":"<account>.dkr.ecr.<region>.amazonaws.com/globe-admin:latest","ImageRepositoryType":"ECR","ImageConfiguration":{"Port":"3001","RuntimeEnvironmentVariables":{"NEXT_PUBLIC_API_BASE_URL":"https://<api-url>"}}},"AuthenticationConfiguration":{"AccessRoleArn":"<app-runner-ecr-access-role-arn>"},"AutoDeploymentsEnabled":false}'
```

## GitHub Secrets / Variables

Repository secrets:
- `AWS_ROLE_TO_ASSUME` (GitHub OIDC role ARN)
- `AWS_APPRUNNER_API_ARN`
- `AWS_APPRUNNER_WEB_ARN`
- `AWS_APPRUNNER_ADMIN_ARN`

Repository variables:
- `AWS_REGION` (for example `us-east-1`)

## Workflows

- `.github/workflows/deploy-api.yml`
- `.github/workflows/deploy-web.yml`
- `.github/workflows/deploy-admin.yml`

Each workflow:
1. Assumes AWS role using OIDC.
2. Builds and pushes image to ECR (`latest` + commit SHA).
3. Calls `aws apprunner start-deployment` for the service.
