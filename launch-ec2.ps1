param (
    [string]$LaunchTemplateName = "SBOM-FYP",
    [string]$LaunchTemplateVersion = "16",
    [string]$KeyPath = "C:\Users\dylan\OneDrive\Documents\College\Year 4\FYP\Keys\PrimaryKeyFYP.pem",
    [switch]$DryRun
)

function Write-Header {
    param([string]$message)
    Write-Host ""
    Write-Host "== $message =======================" -ForegroundColor Cyan
}

Write-Header "Launching EC2 instance using Launch Template '$LaunchTemplateName' (Version $LaunchTemplateVersion)"

if ($DryRun) {
    Write-Host "[DryRun] Skipping actual EC2 launch." -ForegroundColor Yellow
    exit 0
}

# Launch instance
$instanceId = aws ec2 run-instances `
    --launch-template LaunchTemplateName=$LaunchTemplateName,Version=$LaunchTemplateVersion `
    --query 'Instances[0].InstanceId' `
    --output text

if (-not $instanceId -or $instanceId -eq "None") {
    Write-Host "Error: Failed to launch EC2 instance." -ForegroundColor Red
    exit 1
}

Write-Host "Instance launched: $instanceId"
Write-Host "Waiting for instance to enter 'running' state..."

aws ec2 wait instance-running --instance-ids $instanceId

# Get public IP
$publicIp = aws ec2 describe-instances `
    --instance-ids $instanceId `
    --query 'Reservations[0].Instances[0].PublicIpAddress' `
    --output text

if (-not $publicIp -or $publicIp -eq "None") {
    Write-Host "Error: Could not retrieve public IP." -ForegroundColor Red
    exit 1
}

Write-Host "Instance is now running!"
Write-Host "Public IP: $publicIp"

# SSH instruction
Write-Host "`nTo connect via SSH, run:"
Write-Host "ssh -i `"$KeyPath`" ec2-user@$publicIp" -ForegroundColor Green
