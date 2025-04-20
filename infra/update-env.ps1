# update-env.ps1

$envPath = "../api/.env"

if (-Not (Test-Path $envPath)) {
  Write-Host ".env file not found at $envPath"
  exit 1
}

# Load all lines that shouldn't be overwritten
$preservedLines = Get-Content $envPath | Where-Object {
  ($_ -notmatch "^S3_SBOM_BUCKET_NAME=") -and
  ($_ -notmatch "^DYNAMO_PROJECTS_TABLE=") -and
  ($_ -notmatch "^DYNAMO_SBOM_TABLE=")
}

# Run terraform output and parse it
try {
  $outputs = terraform output -json | ConvertFrom-Json
} catch {
  Write-Host "Failed to get terraform output. Did you run 'terraform apply'?"
  exit 1
}

# Prepare updated values
$newLines = @(
  "S3_SBOM_BUCKET_NAME=$($outputs.sbom_bucket_name.value)",
  "DYNAMO_PROJECTS_TABLE=$($outputs.projects_table_name.value)",
  "DYNAMO_SBOM_TABLE=$($outputs.sbom_table_name.value)"
)

# Write the combined content back to the .env
$preservedLines + $newLines | Set-Content -Path $envPath

Write-Host ".env file updated successfully at $envPath"
