param (
    [string]$LaunchTemplateId = "lt-01c26f364cefbf067",
    [string]$LaunchTemplateVersion = "21",
    [switch]$DryRun
)

function Get-InstancesByLaunchTemplate {
    param (
        [string]$TemplateId,
        [string]$TemplateVersion
    )

    Write-Host "Searching for running instances using Launch Template ID: $TemplateId and Version: $TemplateVersion..."

    $instanceData = aws ec2 describe-instances `
        --filters "Name=instance-state-name,Values=running" `
                  "Name=tag:aws:ec2launchtemplate:id,Values=$TemplateId" `
                  "Name=tag:aws:ec2launchtemplate:version,Values=$TemplateVersion" `
        --query "Reservations[*].Instances[*].InstanceId" `
        --output text

    return $instanceData
}

function Terminate-Instances {
    param (
        [string[]]$InstanceIds
    )

    Write-Host "Terminating the following instances: $InstanceIds"
    
    if ($DryRun) {
        Write-Host "Dry run enabled. No instances will be terminated."
        return
    }

    try {
        aws ec2 terminate-instances --instance-ids $InstanceIds
        Write-Host "Waiting for termination..."
        aws ec2 wait instance-terminated --instance-ids $InstanceIds
        Write-Host "All instances have been terminated."
    } catch {
        Write-Error "Failed to terminate instances. Error: $_"
        exit 1
    }
}

# --- MAIN EXECUTION ---

$instances = Get-InstancesByLaunchTemplate -TemplateId $LaunchTemplateId -TemplateVersion $LaunchTemplateVersion

if (-not $instances) {
    Write-Host "No running instances found for this template version."
    exit 0
}

Write-Host "Found instances: $instances"

if (-not $DryRun) {
    $confirm = Read-Host "Are you sure you want to terminate these instances? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Termination cancelled."
        exit 0
    }
}

Terminate-Instances -InstanceIds $instances
