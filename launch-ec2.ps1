param (
    [string]$LaunchTemplateName = "SBOM-FYP",
    [string]$LaunchTemplateVersion = "11",
    [string]$KeyPath = "C:\Users\dylan\OneDrive\Documents\College\Year 4\FYP\Keys\PrimaryKeyFYP.pem"
)

Write-Host "Launching EC2 instance using Launch Template: $LaunchTemplateName (Version $LaunchTemplateVersion)..."

$instanceId = aws ec2 run-instances `
    --launch-template LaunchTemplateName=$LaunchTemplateName,Version=$LaunchTemplateVersion `
    --query 'Instances[0].InstanceId' `
    --output text

if (-not $instanceId) {
    Write-Host "Error: Failed to launch EC2 instance."
    exit 1
}

Write-Host "Instance launched: $instanceId"
Write-Host "Waiting for instance to enter running state..."

aws ec2 wait instance-running --instance-ids $instanceId

$publicIp = aws ec2 describe-instances `
    --instance-ids $instanceId `
    --query 'Reservations[0].Instances[0].PublicIpAddress' `
    --output text

if (-not $publicIp -or $publicIp -eq "None") {
    Write-Host "Error: Could not retrieve public IP."
    exit 1
}

Write-Host "Instance is running. Public IP: $publicIp"

Write-Host "`nTo connect via SSH, run:"
Write-Host "ssh -i `"$KeyPath`" ec2-user@$publicIp"
