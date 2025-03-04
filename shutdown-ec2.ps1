param (
    [string]$LaunchTemplateId = "lt-01c26f364cefbf067",
    [string]$LaunchTemplateVersion = "11"
)

Write-Host "Fetching running EC2 instances using Launch Template ID: $LaunchTemplateId and Version: $LaunchTemplateVersion..."

# Get all instance IDs matching the launch template
$instanceData = aws ec2 describe-instances `
    --filters "Name=instance-state-name,Values=running" `
              "Name=tag:aws:ec2launchtemplate:id,Values=$LaunchTemplateId" `
              "Name=tag:aws:ec2launchtemplate:version,Values=$LaunchTemplateVersion" `
    --query "Reservations[*].Instances[*].InstanceId" `
    --output text

if (-not $instanceData) {
    Write-Host "No running instances found for Launch Template ID: $LaunchTemplateId"
    exit 1
}

Write-Host "Instances found: $instanceData"

# Stop all instances
Write-Host "Stopping instances: $instanceData..."
aws ec2 stop-instances --instance-ids $instanceData
aws ec2 wait instance-stopped --instance-ids $instanceData

Write-Host "All instances have been stopped."
