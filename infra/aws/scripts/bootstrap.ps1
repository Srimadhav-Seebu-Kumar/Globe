param(
  [string]$AwsRegion = "us-east-1",
  [string]$GithubRepo = "Srimadhav-Seebu-Kumar/Globe"
)

$ErrorActionPreference = "Stop"

function Ensure-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' is not available."
  }
}

Ensure-Command "python"

$aws = "python -m awscli"

function Invoke-Aws {
  param([string]$Args)
  Invoke-Expression "$aws $Args"
}

$accountId = (Invoke-Aws "sts get-caller-identity --query Account --output text").Trim()
if (-not $accountId) {
  throw "Unable to resolve AWS account id. Configure AWS credentials first."
}

Write-Host "Using AWS account: $accountId"
Write-Host "Region: $AwsRegion"

$repos = @("globe-api", "globe-web", "globe-admin")
foreach ($repo in $repos) {
  $exists = $true
  try {
    $null = Invoke-Aws "ecr describe-repositories --repository-names $repo --region $AwsRegion"
  } catch {
    $exists = $false
  }

  if (-not $exists) {
    Write-Host "Creating ECR repository: $repo"
    $null = Invoke-Aws "ecr create-repository --repository-name $repo --image-scanning-configuration scanOnPush=true --region $AwsRegion"
  } else {
    Write-Host "ECR repository already exists: $repo"
  }
}

$apprunnerRoleName = "GlobeAppRunnerEcrAccessRole"
$apprunnerRoleArn = "arn:aws:iam::$accountId:role/$apprunnerRoleName"
$apprunnerTrustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@

$apprunnerRoleExists = $true
try {
  $null = Invoke-Aws "iam get-role --role-name $apprunnerRoleName"
} catch {
  $apprunnerRoleExists = $false
}

if (-not $apprunnerRoleExists) {
  Write-Host "Creating App Runner ECR access role: $apprunnerRoleName"
  $policyFile = [System.IO.Path]::GetTempFileName()
  Set-Content -Path $policyFile -Value $apprunnerTrustPolicy
  $null = Invoke-Aws "iam create-role --role-name $apprunnerRoleName --assume-role-policy-document file://$policyFile"
  Remove-Item $policyFile -Force

  $null = Invoke-Aws "iam attach-role-policy --role-name $apprunnerRoleName --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

$oidcProviderArn = "arn:aws:iam::$accountId:oidc-provider/token.actions.githubusercontent.com"
$oidcExists = $true
try {
  $null = Invoke-Aws "iam get-open-id-connect-provider --open-id-connect-provider-arn $oidcProviderArn"
} catch {
  $oidcExists = $false
}

if (-not $oidcExists) {
  Write-Host "Creating GitHub OIDC provider"
  $null = Invoke-Aws "iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1"
}

$deployRoleName = "GlobeGithubDeployRole"
$deployRoleArn = "arn:aws:iam::$accountId:role/$deployRoleName"
$githubSub = "repo:$GithubRepo:*"
$deployTrust = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "$oidcProviderArn"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "$githubSub"
        }
      }
    }
  ]
}
"@

$deployRoleExists = $true
try {
  $null = Invoke-Aws "iam get-role --role-name $deployRoleName"
} catch {
  $deployRoleExists = $false
}

if (-not $deployRoleExists) {
  Write-Host "Creating GitHub deploy role: $deployRoleName"
  $deployTrustFile = [System.IO.Path]::GetTempFileName()
  Set-Content -Path $deployTrustFile -Value $deployTrust
  $null = Invoke-Aws "iam create-role --role-name $deployRoleName --assume-role-policy-document file://$deployTrustFile"
  Remove-Item $deployTrustFile -Force
}

$deployPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart",
        "ecr:DescribeRepositories",
        "ecr:DescribeImages"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "apprunner:StartDeployment",
        "apprunner:DescribeService"
      ],
      "Resource": "*"
    }
  ]
}
'@

$policyFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $policyFile -Value $deployPolicy
$null = Invoke-Aws "iam put-role-policy --role-name $deployRoleName --policy-name GlobeDeployPolicy --policy-document file://$policyFile"
Remove-Item $policyFile -Force

Write-Host "Bootstrap complete."
Write-Host "Set GitHub secret AWS_ROLE_TO_ASSUME = $deployRoleArn"
Write-Host "App Runner ECR access role ARN: $apprunnerRoleArn"
Write-Host "ECR repos created: globe-api, globe-web, globe-admin"
