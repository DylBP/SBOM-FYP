# ─── S3 Bucket Output ───────────────────────────────
output "sbom_bucket_name" {
  description = "The name of the generated S3 bucket for SBOM files"
  value       = aws_s3_bucket.sbom_bucket.bucket
}

# ─── DynamoDB Table Outputs ─────────────────────────
output "projects_table_name" {
  description = "The name of the DynamoDB table for projects"
  value       = aws_dynamodb_table.projects_table.name
}

output "sbom_table_name" {
  description = "The name of the DynamoDB table for SBOMs"
  value       = aws_dynamodb_table.sbom_table.name
}

# ─── EC2 Instance Output ───────────────────────────
output "instance_public_ip" {
  value = aws_instance.sbom_instance.public_ip
}

# ─── Cognito User Pool / Client Output ───────────────────────
output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.sbom_user_pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.sbom_app_client.id
}

output "cognito_client_secret" {
  value     = aws_cognito_user_pool_client.sbom_app_client.client_secret
  sensitive = true
}